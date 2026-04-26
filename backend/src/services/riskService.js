/**
 * Risk Service - Monitors margin levels and triggers Stop Outs
 */
const { prisma } = require('../config/prisma');
const priceService = require('./priceService');
const positionService = require('./positionService');

class RiskService {
  async checkStopOuts() {
    try {
      // 1. Get all active trading accounts with open positions
      const accounts = await prisma.tradingAccount.findMany({
        where: {
          status: 'ACTIVE',
          positions: { some: { status: 'OPEN' } }
        },
        include: {
          positions: {
            where: { status: 'OPEN' },
            include: { instrument: true }
          }
        }
      });

      for (const account of accounts) {
        // 2. Calculate current equity and margin level
        let totalUnrealizedPnl = 0;
        
        for (const pos of account.positions) {
          const priceData = priceService.getLivePrice(pos.instrument.symbol);
          // Fall back to instrument DB price (which is tick-updated for forex pairs)
          const currentBid = priceData?.bid ?? Number(pos.instrument.bid);
          const currentAsk = priceData?.ask ?? Number(pos.instrument.ask);
          const currentPrice = pos.side === 'BUY' ? currentBid : currentAsk;
          if (!currentPrice) continue;

          const contractSize = Number(pos.instrument.contractSize);
          const diff = pos.side === 'BUY' 
            ? (currentPrice - Number(pos.openPrice)) 
            : (Number(pos.openPrice) - currentPrice);
          
          totalUnrealizedPnl += diff * Number(pos.volumeLots) * contractSize;
        }

        const currentEquity = Number(account.balance) + totalUnrealizedPnl;
        const currentMargin = Number(account.margin);
        
        if (currentMargin <= 0) continue;

        const marginLevel = (currentEquity / currentMargin) * 100;

        // Update equity, freeMargin and margin level in DB
        await prisma.tradingAccount.update({
          where: { id: account.id },
          data: {
            equity: currentEquity,
            freeMargin: Math.max(0, currentEquity - currentMargin),
            marginLevel: marginLevel
          }
        });

        // 3. Stop Out Logic: Trigger if Margin Level < 20%
        if (marginLevel < 20) {
          console.log(`[RiskService] STOP OUT triggered for Account ${account.accountNumber} (Level: ${marginLevel.toFixed(2)}%)`);
          await this.executeStopOut(account);
        }
      }
    } catch (error) {
      console.error('[RiskService] Error in checkStopOuts:', error);
    }
  }

  async executeStopOut(account) {
    // Exness rule: Close the position with the largest loss first
    // For simplicity here, we'll close the most recent position or all depending on configuration
    // In this implementation, we close ALL to protect remaining balance
    const openPositions = account.positions;
    
    // Import orderService dynamically to avoid circular dependency
    const orderService = require('./orderService');
    
    for (const pos of openPositions) {
      try {
        await orderService.closePosition(pos.id);
        console.log(`[RiskService] Stop out closed position ${pos.positionNumber}`);
      } catch (err) {
        console.error(`[RiskService] Failed to close position ${pos.id} during stop out:`, err);
      }
    }

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: account.userId,
        title: 'Stop Out Triggered',
        message: `Your account ${account.accountNumber} has reached a critical margin level and positions were closed automatically to protect your balance.`,
        type: 'margin_call'
      }
    });
  }

  startMonitoring(intervalMs = 2000) {
    console.log(`[RiskService] Monitoring started (Interval: ${intervalMs}ms)`);
    this.monitorId = setInterval(() => this.checkStopOuts(), intervalMs);
  }

  stopMonitoring() {
    if (this.monitorId) {
      clearInterval(this.monitorId);
      this.monitorId = null;
      console.log(`[RiskService] Monitoring stopped`);
    }
  }
}

module.exports = new RiskService();
