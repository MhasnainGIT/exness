/**
 * Trading Socket - Real-time updates via Socket.io
 */
const { Server } = require('socket.io');
const priceService = require('../services/priceService');
const positionService = require('../services/positionService');
const orderService = require('../services/orderService');
const eventBus = require('../services/eventBus');
const logger = require('../utils/logger');

let io = null;
const userSockets = new Map(); // userId -> Set of socket IDs

function initTradingSocket(server) {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  io.on('connection', (socket) => {
    logger.info(`[TradingSocket] Client connected: ${socket.id}`);
    
    socket.on('auth', ({ userId }) => {
      socket.userId = userId;
      if (!userSockets.has(userId)) userSockets.set(userId, new Set());
      userSockets.get(userId).add(socket.id);
      socket.emit('authenticated', { success: true, userId });
    });

    socket.on('subscribe', ({ symbols }) => {
      symbols.forEach(s => socket.join(`price:${s.toUpperCase()}`));
      socket.emit('subscribed', { symbols });
    });

    socket.on('unsubscribe', ({ symbols }) => {
      symbols.forEach(s => socket.leave(`price:${s.toUpperCase()}`));
    });

    socket.on('subscribePositions', () => {
      if (socket.userId) socket.join(`positions:${socket.userId}`);
    });

    socket.on('subscribeOrders', () => {
      if (socket.userId) socket.join(`orders:${socket.userId}`);
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        const sockets = userSockets.get(socket.userId);
        if (sockets) { sockets.delete(socket.id); if (sockets.size === 0) userSockets.delete(socket.userId); }
      }
    });
  });

  // Price updates -> room subscribers (Now via Redis EventBus)
  eventBus.subscribe('price_updates', (priceData) => {
    io?.to(`price:${priceData.symbol}`).emit('priceUpdate', priceData);
  });

  // Position updates -> user
  positionService.positionEmitter.on('positionOpened', (position) => {
    emitToUser(position.userId, 'positionOpened', position);
  });
  positionService.positionEmitter.on('positionClosed', (position) => {
    emitToUser(position.userId, 'positionClosed', position);
  });

  // Order updates -> user
  if (typeof orderService.onOrderExecuted === 'function') {
    orderService.onOrderExecuted(({ order, position }) => {
      emitToUser(order.userId, 'orderExecuted', { order, position });
    });
  } else {
    orderService.on('orderExecuted', ({ order, position }) => {
      emitToUser(order.userId, 'orderExecuted', { order, position });
    });
  }

  if (typeof orderService.onPositionClosed === 'function') {
    orderService.onPositionClosed((position) => {
      emitToUser(position.userId, 'positionClosed', position);
    });
  } else {
    orderService.on('positionClosed', (position) => {
      emitToUser(position.userId, 'positionClosed', position);
    });
  }

  // Broadcast PnL every 2 seconds
  setInterval(async () => {
    for (const [userId] of userSockets) {
      const pnlData = await positionService.calcUnrealizedPnL(userId);
      emitToUser(userId, 'pnlUpdate', pnlData);
    }
  }, 2000);

  logger.info('[TradingSocket] Initialized');
  return io;
}

function emitToUser(userId, event, data) {
  if (!io || !userId) return;
  io.to(`orders:${userId}`).emit(event, data);
  io.to(`positions:${userId}`).emit(event, data);
}

function emitPriceUpdate(symbol, priceData) {
  io?.to(`price:${symbol}`).emit('priceUpdate', priceData);
}

function broadcastAll(event, data) {
  io?.emit(event, data);
}

function getIO() { return io; }

module.exports = { initTradingSocket, emitToUser, emitPriceUpdate, broadcastAll, getIO };
