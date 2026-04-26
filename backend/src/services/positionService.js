/**
 * Position Service - Real-time position tracking and PnL calculation using Prisma
 */
const { prisma } = require('../config/prisma');
const priceService = require('./priceService');
const EventEmitter = require('events');

class PositionService {
  constructor() {
    this.positionEmitter = new EventEmitter();
  }

  async calcUnrealizedPnL(userId) {
    try {
      // 1. Get all open positions for user
      const positions = await prisma.position.findMany({
        where: { userId, status: 'OPEN' },
        include: { instrument: true }
      });

      if (!positions.length) return { totalPnl: 0, positions: [] };

      let totalPnl = 0;
      const formattedPositions = [];

      for (const pos of positions) {
        const symbol = pos.instrument.symbol;
        const priceData = priceService.getLivePrice(symbol);
        
        if (!priceData) continue;

        const currentPrice = pos.side === 'BUY' ? priceData.bid : priceData.ask;
        const contractSize = Number(pos.instrument.contractSize);
        const qty = Number(pos.volumeLots);
        const entry = Number(pos.openPrice);

        const diff = pos.side === 'BUY' ? (currentPrice - entry) : (entry - currentPrice);
        const pnl = diff * qty * contractSize;

        totalPnl += pnl;
        formattedPositions.push({
          ...pos,
          currentPrice,
          unrealizedPnl: pnl,
          instrumentSymbol: symbol
        });
      }

      return { totalPnl, positions: formattedPositions };
    } catch (error) {
      console.error('[PositionService] Error calculating PnL:', error);
      return { totalPnl: 0, positions: [] };
    }
  }

  async getPositions(userId) {
    return this.calcUnrealizedPnL(userId);
  }

  async setStopLoss(userId, positionId, slPrice) {
    return await prisma.position.update({
      where: { id: positionId, userId },
      data: { stopLoss: parseFloat(slPrice) }
    });
  }

  async setTakeProfit(userId, positionId, tpPrice) {
    return await prisma.position.update({
      where: { id: positionId, userId },
      data: { takeProfit: parseFloat(tpPrice) }
    });
  }
}

module.exports = new PositionService();

