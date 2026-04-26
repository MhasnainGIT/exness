/**
 * Order Service - Real-time order execution with Prisma persistence
 */
const { prisma } = require('../config/prisma');
const priceService = require('./priceService');
const positionService = require('./positionService');
const EventEmitter = require('events');

class OrderService extends EventEmitter {
  constructor() {
    super();
    this.EXECUTION_DELAY_MIN = 200; // Increased for realistic feel
    this.EXECUTION_DELAY_MAX = 500;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async executeOrder({ tradingAccountId, instrumentSymbol, side, type, volumeLots, stopLoss, takeProfit }) {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get Trading Account
      const account = await tx.tradingAccount.findUnique({
        where: { id: tradingAccountId }
      });

      if (!account) throw new Error('Trading account not found');

      // 2. Get Instrument
      const instrument = await tx.instrument.findUnique({
        where: { symbol: instrumentSymbol }
      });

      if (!instrument) throw new Error('Instrument not found');

      // 3. Get Price
      const priceData = priceService.getLivePrice(instrumentSymbol);
      const executionPrice = side === 'BUY' ? priceData.ask : priceData.bid;

      if (!executionPrice) throw new Error(`No live price for ${instrumentSymbol}`);

      // 4. Calculate Margin: (Lot Size × Contract Size) / Leverage
      const contractSize = Number(instrument.contractSize);
      const leverage = account.leverage;
      const marginNeeded = (volumeLots * contractSize) / leverage;

      // Simulate execution delay
      const delay = Math.floor(Math.random() * (this.EXECUTION_DELAY_MAX - this.EXECUTION_DELAY_MIN)) + this.EXECUTION_DELAY_MIN;
      await this.sleep(delay);

      if (Number(account.freeMargin) < marginNeeded) {
        throw new Error('Insufficient margin to open position');
      }

      // 5. Create Order record
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: account.userId,
          tradingAccountId: account.id,
          instrumentId: instrument.id,
          side,
          type,
          status: 'FILLED',
          volumeLots,
          requestedPrice: executionPrice,
          executedPrice: executionPrice,
          stopLoss: stopLoss || null,
          takeProfit: takeProfit || null,
          marginUsed: marginNeeded,
        }
      });

      // 6. Create Position
      const positionNumber = `POS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const position = await tx.position.create({
        data: {
          positionNumber,
          userId: account.userId,
          tradingAccountId: account.id,
          instrumentId: instrument.id,
          orderId: order.id,
          side,
          status: 'OPEN',
          volumeLots,
          openPrice: executionPrice,
          stopLoss: stopLoss || null,
          takeProfit: takeProfit || null,
          marginUsed: marginNeeded,
        }
      });

      // 7. Update Account Margin
      await tx.tradingAccount.update({
        where: { id: account.id },
        data: {
          margin: { increment: marginNeeded },
          freeMargin: { decrement: marginNeeded },
        }
      });

      return { order, position };
    });

    // Emit event for real-time updates
    this.emit('orderExecuted', result);
    return result;
  }

  async closePosition(positionId) {
    const result = await prisma.$transaction(async (tx) => {
      const position = await tx.position.findUnique({
        where: { id: positionId },
        include: { instrument: true, tradingAccount: true }
      });

      if (!position || position.status === 'CLOSED') {
        throw new Error('Position not found or already closed');
      }

      const priceData = priceService.getLivePrice(position.instrument.symbol);
      const closePrice = position.side === 'BUY' ? priceData.bid : priceData.ask;

      const contractSize = Number(position.instrument.contractSize);
      const diff = position.side === 'BUY' 
        ? (closePrice - Number(position.openPrice)) 
        : (Number(position.openPrice) - closePrice);
      
      const profitLoss = diff * Number(position.volumeLots) * contractSize;

      const updatedPosition = await tx.position.update({
        where: { id: position.id },
        data: {
          status: 'CLOSED',
          closePrice: closePrice,
          closedAt: new Date(),
          profitLoss: profitLoss,
        }
      });

      await tx.tradingAccount.update({
        where: { id: position.tradingAccountId },
        data: {
          balance: { increment: profitLoss },
          equity: { increment: profitLoss },
          margin: { decrement: position.marginUsed },
          freeMargin: { increment: position.marginUsed },
        }
      });

      return updatedPosition;
    });

    // Emit event for real-time updates
    this.emit('positionClosed', result);
    return result;
  }

  // Socket helper methods
  onOrderExecuted(callback) {
    this.on('orderExecuted', callback);
  }

  onPositionClosed(callback) {
    this.on('positionClosed', callback);
  }

  async getOrderHistory(tradingAccountId) {
    return await prisma.order.findMany({
      where: { tradingAccountId },
      orderBy: { placedAt: 'desc' },
      take: 50
    });
  }

  async getOpenPositions(tradingAccountId) {
    return await prisma.position.findMany({
      where: { tradingAccountId, status: 'OPEN' },
      include: { instrument: true }
    });
  }
}

module.exports = new OrderService();


