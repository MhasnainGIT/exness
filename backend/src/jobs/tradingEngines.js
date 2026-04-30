const { prisma } = require("../config/prisma");
const { roundCurrency } = require("../utils/number");
const { createNotification } = require("../notifications/notification.service");

function calcPnl({ side, openPrice, closePrice, volumeLots, contractSize }) {
  const points = side === "BUY" ? closePrice - openPrice : openPrice - closePrice;
  return roundCurrency(points * volumeLots * contractSize);
}

async function closePositionInternal(tx, position, closePrice, reason) {
  const realizedPnl = calcPnl({
    side: position.side,
    openPrice: Number(position.openPrice),
    closePrice,
    volumeLots: Number(position.volumeLots),
    contractSize: Number(position.instrument.contractSize),
  });

  await tx.position.update({
    where: { id: position.id },
    data: { status: "CLOSED", closePrice, profitLoss: realizedPnl, closedAt: new Date() },
  });

  const acc = position.tradingAccount;
  const nextBalance = roundCurrency(Number(acc.balance) + realizedPnl);
  const nextMargin = roundCurrency(Number(acc.margin) - Number(position.marginUsed));
  const nextFreeMargin = roundCurrency(nextBalance - nextMargin);
  const nextMarginLevel = nextMargin === 0 ? 0 : roundCurrency((nextBalance / nextMargin) * 100);

  await tx.tradingAccount.update({
    where: { id: acc.id },
    data: { balance: nextBalance, equity: nextBalance, margin: nextMargin, freeMargin: nextFreeMargin, marginLevel: nextMarginLevel },
  });

  if (acc.walletId) {
    await tx.walletTransaction.create({
      data: {
        walletId: acc.walletId,
        userId: position.userId,
        tradingAccountId: acc.id,
        type: "TRADE_PNL",
        status: "COMPLETED",
        amount: realizedPnl,
        reference: `${reason}-${position.id}-${Date.now()}`,
        description: `${reason}: ${position.positionNumber} closed at ${closePrice}`,
      },
    });

    // Update the wallet balance itself
    await tx.wallet.update({
      where: { id: acc.walletId },
      data: { balance: { increment: realizedPnl } },
    });
  }

  await tx.auditLog.create({
    data: {
      userId: position.userId,
      action: reason,
      entityType: "Position",
      entityId: position.id,
      description: `${position.positionNumber} auto-closed at ${closePrice}, PnL: ${realizedPnl}`,
      metadata: { closePrice, realizedPnl, reason },
    },
  });

  return realizedPnl;
}

async function runSlTpEngine() {
  const positions = await prisma.position.findMany({
    where: { status: "OPEN", OR: [{ stopLoss: { not: null } }, { takeProfit: { not: null } }] },
    include: { instrument: true, tradingAccount: true },
  });

  for (const position of positions) {
    const bid = Number(position.instrument.bid);
    const ask = Number(position.instrument.ask);
    const sl = position.stopLoss ? Number(position.stopLoss) : null;
    const tp = position.takeProfit ? Number(position.takeProfit) : null;

    let triggered = false;
    let closePrice = null;
    let reason = null;

    if (position.side === "BUY") {
      if (sl && bid <= sl) { closePrice = bid; reason = "STOP_LOSS_HIT"; triggered = true; }
      else if (tp && bid >= tp) { closePrice = bid; reason = "TAKE_PROFIT_HIT"; triggered = true; }
    } else {
      if (sl && ask >= sl) { closePrice = ask; reason = "STOP_LOSS_HIT"; triggered = true; }
      else if (tp && ask <= tp) { closePrice = ask; reason = "TAKE_PROFIT_HIT"; triggered = true; }
    }

    if (triggered) {
      try {
        const pnl = await prisma.$transaction((tx) => closePositionInternal(tx, position, closePrice, reason));
        const isTP = reason === "TAKE_PROFIT_HIT";
        await createNotification(position.userId, {
          title: isTP ? "Take Profit Hit 🎯" : "Stop Loss Hit 🛑",
          message: `${position.positionNumber} (${position.instrument.symbol}) closed at ${closePrice}. PnL: ${pnl >= 0 ? "+" : ""}${pnl} USD`,
          type: "trade",
          metadata: { positionId: position.id, pnl, closePrice, reason },
        });
      } catch (err) {
        console.error(`SL/TP engine error for ${position.positionNumber}:`, err.message);
      }
    }
  }
}

async function runMarginCallEngine() {
  const accounts = await prisma.tradingAccount.findMany({
    where: { status: "ACTIVE", margin: { gt: 0 }, marginLevel: { gt: 0, lt: 50 } },
  });

  for (const account of accounts) {
    const positions = await prisma.position.findMany({
      where: { tradingAccountId: account.id, status: "OPEN" },
      include: { instrument: true, tradingAccount: true },
      orderBy: { profitLoss: "asc" },
    });

    let notified = false;
    for (const position of positions) {
      const currentAccount = await prisma.tradingAccount.findUnique({ where: { id: account.id } });
      if (!currentAccount || Number(currentAccount.marginLevel) >= 50) break;

      const closePrice = position.side === "BUY" ? Number(position.instrument.bid) : Number(position.instrument.ask);

      try {
        await prisma.$transaction((tx) => closePositionInternal(tx, { ...position, tradingAccount: currentAccount }, closePrice, "MARGIN_CALL"));
        if (!notified) {
          await createNotification(account.userId, {
            title: "⚠️ Margin Call",
            message: `Your account #${account.accountNumber} margin level dropped below 50%. Positions are being closed.`,
            type: "margin_call",
            metadata: { accountId: account.id, marginLevel: Number(currentAccount.marginLevel) },
          });
          notified = true;
        }
      } catch (err) {
        console.error(`Margin call error for ${position.positionNumber}:`, err.message);
      }
    }
  }
}

async function runPendingOrdersEngine() {
  const pendingOrders = await prisma.order.findMany({
    where: { status: "PENDING" },
    include: { instrument: true, tradingAccount: true },
  });

  for (const order of pendingOrders) {
    const bid = Number(order.instrument.bid);
    const ask = Number(order.instrument.ask);
    const trigger = Number(order.requestedPrice);
    
    let triggered = false;
    let executionPrice = null;

    if (order.side === "BUY") {
      if (order.type === "LIMIT" && ask <= trigger) { triggered = true; executionPrice = ask; }
      else if (order.type === "STOP" && ask >= trigger) { triggered = true; executionPrice = ask; }
    } else {
      if (order.type === "LIMIT" && bid >= trigger) { triggered = true; executionPrice = bid; }
      else if (order.type === "STOP" && bid <= trigger) { triggered = true; executionPrice = bid; }
    }

    if (triggered) {
      try {
        await prisma.$transaction(async (tx) => {
          const positionNumber = `POS-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
          const contractSize = Number(order.instrument.contractSize);
          const requiredMargin = roundCurrency((executionPrice * Number(order.volumeLots) * contractSize) / order.tradingAccount.leverage);

          if (requiredMargin > Number(order.tradingAccount.freeMargin)) {
             // Not enough margin at trigger time
             await tx.order.update({ where: { id: order.id }, data: { status: "REJECTED", rejectionReason: "Insufficient margin at trigger price" } });
             return;
          }

          const filledOrder = await tx.order.update({
            where: { id: order.id },
            data: { status: "FILLED", executedPrice: executionPrice, marginUsed: requiredMargin },
          });

          await tx.position.create({
            data: {
              userId: order.userId,
              tradingAccountId: order.tradingAccountId,
              instrumentId: order.instrumentId,
              orderId: filledOrder.id,
              positionNumber,
              side: order.side,
              volumeLots: order.volumeLots,
              openPrice: executionPrice,
              stopLoss: order.stopLoss,
              takeProfit: order.takeProfit,
              marginUsed: requiredMargin,
            },
          });

          await tx.tradingAccount.update({
            where: { id: order.tradingAccountId },
            data: {
              margin: { increment: requiredMargin },
              freeMargin: { decrement: requiredMargin },
            },
          });
        });

        await createNotification(order.userId, {
          title: "Pending Order Filled ⚡",
          message: `${order.side} ${order.instrument.symbol} (${order.type}) executed at ${executionPrice}`,
          type: "trade",
        });
      } catch (err) {
        console.error(`Pending order engine error for ${order.orderNumber}:`, err.message);
      }
    }
  }
}

async function runSwapEngine() {
  // TODO: Implement daily swap charging logic
  // console.log('[SwapEngine] Tick');
}

let intervals = [];

function startEngines() {
  intervals.push(setInterval(runSlTpEngine, 2000));
  intervals.push(setInterval(runMarginCallEngine, 5000));
  intervals.push(setInterval(runSwapEngine, 5 * 60 * 1000));
  intervals.push(setInterval(runPendingOrdersEngine, 3000));
  console.log("Trading engines started (SL/TP, Margin Call, Swap, Pending)");
}

function stopEngines() {
  intervals.forEach(clearInterval);
  intervals = [];
  console.log("Trading engines stopped");
}

module.exports = { startEngines, stopEngines };
