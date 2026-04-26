const { Prisma } = require("@prisma/client");
const { prisma } = require("../config/prisma");
const { roundCurrency } = require("../utils/number");
const { createNotification } = require("../notifications/notification.service");
const orderService = require("../services/orderService");
const positionService = require("../services/positionService");

function calcMarginRequired({ price, volumeLots, leverage, contractSize }) {
  return roundCurrency((price * volumeLots * contractSize) / leverage);
}

function calcUnrealizedPnl({ side, openPrice, marketBid, marketAsk, volumeLots, contractSize }) {
  const exit = side === "BUY" ? marketBid : marketAsk;
  const points = side === "BUY" ? exit - openPrice : openPrice - exit;
  return roundCurrency(points * volumeLots * contractSize);
}

async function placeOrder({ userId, tradingAccountId, instrumentSymbol, side, type, volumeLots, stopLoss, takeProfit }) {
  const account = await prisma.tradingAccount.findFirst({
    where: { id: tradingAccountId, userId, status: "ACTIVE", canTrade: true },
  });
  if (!account) {
    const error = new Error("Trading account not found or unavailable");
    error.statusCode = 404;
    throw error;
  }

  const instrument = await prisma.instrument.findUnique({ where: { symbol: instrumentSymbol } });
  if (!instrument || !instrument.isActive) {
    const error = new Error("Instrument is unavailable");
    error.statusCode = 404;
    throw error;
  }

  const lots = Number(volumeLots);
  if (lots < Number(instrument.minLot) || lots > Number(instrument.maxLot)) {
    const error = new Error(`Volume must be between ${instrument.minLot} and ${instrument.maxLot} lots`);
    error.statusCode = 400;
    throw error;
  }

  const marketPrice = side === "BUY" ? Number(instrument.ask) : Number(instrument.bid);
  const contractSize = Number(instrument.contractSize);
  const requiredMargin = calcMarginRequired({ price: marketPrice, volumeLots: lots, leverage: account.leverage, contractSize });

  if (requiredMargin > Number(account.freeMargin)) {
    const error = new Error("Insufficient free margin");
    error.statusCode = 400;
    throw error;
  }

  const result = await prisma.$transaction(async (tx) => {
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    const positionNumber = `POS-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    const nextMargin = roundCurrency(Number(account.margin) + requiredMargin);
    const nextFreeMargin = roundCurrency(Number(account.equity) - nextMargin);
    const nextMarginLevel = nextMargin === 0 ? 0 : roundCurrency((Number(account.equity) / nextMargin) * 100);

    const isMarket = !type || type === "MARKET";
    const status = isMarket ? "FILLED" : "PENDING";

    const order = await tx.order.create({
      data: {
        userId,
        tradingAccountId: account.id,
        instrumentId: instrument.id,
        orderNumber,
        side,
        type: type || "MARKET",
        status: status,
        volumeLots: new Prisma.Decimal(lots),
        requestedPrice: marketPrice,
        executedPrice: isMarket ? marketPrice : null,
        stopLoss: stopLoss != null ? new Prisma.Decimal(stopLoss) : null,
        takeProfit: takeProfit != null ? new Prisma.Decimal(takeProfit) : null,
        marginUsed: requiredMargin,
      },
    });

    let position = null;
    if (isMarket) {
      position = await tx.position.create({
        data: {
          userId,
          tradingAccountId: account.id,
          instrumentId: instrument.id,
          orderId: order.id,
          positionNumber,
          side,
          volumeLots: new Prisma.Decimal(lots),
          openPrice: marketPrice,
          stopLoss: stopLoss != null ? new Prisma.Decimal(stopLoss) : null,
          takeProfit: takeProfit != null ? new Prisma.Decimal(takeProfit) : null,
          marginUsed: requiredMargin,
        },
      });
    }

    const updatedAccount = isMarket ? await tx.tradingAccount.update({
      where: { id: account.id },
      data: { margin: nextMargin, freeMargin: nextFreeMargin, marginLevel: nextMarginLevel },
    }) : account;

    await tx.auditLog.create({
      data: {
        userId,
        action: isMarket ? "ORDER_PLACED" : "PENDING_ORDER_PLACED",
        entityType: "Order",
        entityId: order.id,
        description: `${side} ${lots} lots of ${instrumentSymbol} at ${marketPrice} (${status})`,
        metadata: { orderNumber, positionNumber, requiredMargin },
      },
    });

    const data = { order, position, account: updatedAccount };
    
    // Emit real-time events via orderService emitter
    if (isMarket) {
      orderService.emit('orderExecuted', { order, position });
    }

    return data;
  });

  // Non-blocking notification
  createNotification(userId, {
    title: `Order Filled — ${side} ${instrumentSymbol}`,
    message: `${lots} lots of ${instrumentSymbol} opened at ${marketPrice}. Margin: ${requiredMargin} USD`,
    type: "trade",
    metadata: { side, symbol: instrumentSymbol, lots, price: marketPrice },
  }).catch(() => {});

  return result;
}

async function listOpenPositions(userId, accountId) {
  const where = { userId, status: "OPEN", ...(accountId && { tradingAccountId: accountId }) };
  const positions = await prisma.position.findMany({
    where,
    include: { instrument: true, tradingAccount: { select: { accountNumber: true, leverage: true } } },
    orderBy: { openedAt: "desc" },
  });

  return positions.map((p) => ({
    ...p,
    instrumentSymbol: p.instrument.symbol,
    entryPrice: Number(p.openPrice),
    volumeLots: Number(p.volumeLots),
    unrealizedPnl: calcUnrealizedPnl({
      side: p.side,
      openPrice: Number(p.openPrice),
      marketBid: Number(p.instrument.bid),
      marketAsk: Number(p.instrument.ask),
      volumeLots: Number(p.volumeLots),
      contractSize: Number(p.instrument.contractSize),
    }),
  }));
}

async function closePosition({ userId, positionId }) {
  const position = await prisma.position.findFirst({
    where: { id: positionId, userId, status: "OPEN" },
    include: { instrument: true, tradingAccount: true },
  });
  if (!position) {
    const error = new Error("Open position not found");
    error.statusCode = 404;
    throw error;
  }

  const closePrice = position.side === "BUY" ? Number(position.instrument.bid) : Number(position.instrument.ask);
  const realizedPnl = calcUnrealizedPnl({
    side: position.side,
    openPrice: Number(position.openPrice),
    marketBid: Number(position.instrument.bid),
    marketAsk: Number(position.instrument.ask),
    volumeLots: Number(position.volumeLots),
    contractSize: Number(position.instrument.contractSize),
  });

  const result = await prisma.$transaction(async (tx) => {
    const closedPosition = await tx.position.update({
      where: { id: position.id },
      data: { status: "CLOSED", closePrice, profitLoss: realizedPnl, closedAt: new Date() },
    });

    const nextBalance = roundCurrency(Number(position.tradingAccount.balance) + realizedPnl);
    const nextMargin = roundCurrency(Number(position.tradingAccount.margin) - Number(position.marginUsed));
    const nextFreeMargin = roundCurrency(nextBalance - nextMargin);
    const nextMarginLevel = nextMargin === 0 ? 0 : roundCurrency((nextBalance / nextMargin) * 100);

    const updatedAccount = await tx.tradingAccount.update({
      where: { id: position.tradingAccount.id },
      data: { balance: nextBalance, equity: nextBalance, margin: nextMargin, freeMargin: nextFreeMargin, marginLevel: nextMarginLevel },
    });

    if (position.tradingAccount.walletId) {
      await tx.walletTransaction.create({
        data: {
          walletId: position.tradingAccount.walletId,
          userId,
          tradingAccountId: position.tradingAccount.id,
          type: "TRADE_PNL",
          status: "COMPLETED",
          amount: realizedPnl,
          reference: `PNL-${Date.now()}`,
          description: `Realized PnL for ${position.positionNumber}`,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        userId,
        action: "POSITION_CLOSED",
        entityType: "Position",
        entityId: position.id,
        description: `Closed ${position.positionNumber} at ${closePrice}, PnL: ${realizedPnl}`,
        metadata: { closePrice, realizedPnl },
      },
    });

    return { position: closedPosition, account: updatedAccount, realizedPnl };
  });

  createNotification(userId, {
    title: `Position Closed — ${position.instrument.symbol}`,
    message: `${position.positionNumber} closed at ${closePrice}. PnL: ${realizedPnl >= 0 ? "+" : ""}${realizedPnl} USD`,
    type: "trade",
    metadata: { positionId: position.id, closePrice, realizedPnl },
  }).catch(() => {});

  return result;
}

async function modifyPosition({ userId, positionId, stopLoss, takeProfit }) {
  const position = await prisma.position.findFirst({ where: { id: positionId, userId, status: "OPEN" } });
  if (!position) {
    const error = new Error("Open position not found");
    error.statusCode = 404;
    throw error;
  }
  return prisma.position.update({
    where: { id: positionId },
    data: {
      stopLoss: stopLoss != null ? new Prisma.Decimal(stopLoss) : null,
      takeProfit: takeProfit != null ? new Prisma.Decimal(takeProfit) : null,
    },
  });
}

async function getOrderHistory(userId, { page = 1, limit = 20, accountId, status, symbol }) {
  const skip = (page - 1) * limit;
  const where = {
    userId,
    ...(accountId && { tradingAccountId: accountId }),
    ...(status && { status }),
    ...(symbol && { instrument: { symbol } }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { placedAt: "desc" },
      include: {
        instrument: { select: { symbol: true, displayName: true, type: true } },
        tradingAccount: { select: { accountNumber: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } };
}

async function getTradingOverview(userId) {
  const [accounts, openPositions, totalOrders] = await Promise.all([
    prisma.tradingAccount.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.position.count({ where: { userId, status: "OPEN" } }),
    prisma.order.count({ where: { userId } }),
  ]);
  return { accounts, openPositions, totalOrders };
}

async function listPositionHistory(userId, accountId) {
  const where = { userId, status: "CLOSED", ...(accountId && { tradingAccountId: accountId }) };
  const positions = await prisma.position.findMany({
    where,
    include: { instrument: true },
    orderBy: { closedAt: "desc" },
  });

  return positions.map((p) => ({
    ...p,
    instrumentSymbol: p.instrument.symbol,
    entryPrice: Number(p.openPrice),
    exitPrice: Number(p.closePrice),
    volumeLots: Number(p.volumeLots),
    profit: Number(p.profitLoss),
  }));
}

async function createTradingAccount(userId, { accountType, platform, leverage, initialBalance }) {
  const accountNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
  
  const balance = accountType === "DEMO" ? (Number(initialBalance) || 10000) : 0;
  
  return prisma.tradingAccount.create({
    data: {
      userId,
      accountNumber,
      accountType,
      platform: platform || "exness-web",
      leverage: Number(leverage) || 2000,
      balance,
      equity: balance,
      freeMargin: balance,
      status: "ACTIVE",
    },
  });
}

async function cancelOrder({ userId, orderId }) {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId, status: "PENDING" } });
  if (!order) {
    const error = new Error("Pending order not found");
    error.statusCode = 404;
    throw error;
  }
  const cancelledOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: "CANCELLED" },
  });
  await prisma.auditLog.create({
    data: {
      userId,
      action: "ORDER_CANCELLED",
      entityType: "Order",
      entityId: order.id,
      description: `Cancelled pending order ${order.orderNumber}`,
    },
  });
  return cancelledOrder;
}

module.exports = { 
  placeOrder, 
  listOpenPositions, 
  closePosition, 
  modifyPosition, 
  getOrderHistory, 
  getTradingOverview,
  listPositionHistory,
  cancelOrder,
  createTradingAccount
};
