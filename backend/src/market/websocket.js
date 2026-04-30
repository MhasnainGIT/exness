const WebSocket = require("ws");
const { prisma } = require("../config/prisma");
const { redis } = require("../config/redis");
const { roundPrice } = require("../utils/number");
const { updateCandles } = require("../ohlc/ohlc.service");
const priceService = require("../services/priceService");
const eventBus = require("../services/eventBus");
const logger = require("../utils/logger");

const priceCache = new Map();
let wssRef = null;

// Link priceCache to priceService so it can update it directly
priceService.setPriceCache(priceCache);

// Push notification to a specific user over WebSocket
function pushToUser(userId, payload) {
  if (!wssRef) return;
  wssRef.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN && ws.userId === userId) {
      ws.send(JSON.stringify(payload));
    }
  });
}

let tickCount = 0;
async function tickAllInstruments() {
  try {
    tickCount++;
    const instruments = await prisma.instrument.findMany({ where: { isActive: true } });
    const binanceTracked = new Set(priceService.subscribedSymbols);
    const { SYMBOL_MAP } = require("../services/priceService");

    const updatePromises = instruments.map(async (inst) => {
      // Skip synthetic generation for symbols handled by Binance
      if (SYMBOL_MAP[inst.symbol]) {
         return;
      }

      const bid = Number(inst.bid);
      const spread = Number(inst.spread);
      // REDUCE DRIFT: 0.15 multiplier for professional, smoother movement
      const drift = (Math.random() - 0.5) * spread * 0.15;
      const nextBid = roundPrice(Math.max(0.00001, bid + drift));
      const nextAsk = roundPrice(nextBid + spread);

      // FAST PATH: Update memory cache and Redis
      const tick = { 
        symbol: inst.symbol, 
        bid: nextBid, 
        ask: nextAsk, 
        spread: roundPrice(nextAsk - nextBid), 
        timestamp: Date.now() 
      };
      
      priceCache.set(inst.symbol, tick);
      eventBus.publish('price_updates', tick);

      if (redis && redis.status === 'ready') {
        redis.set(`price:${inst.symbol}`, JSON.stringify(tick), "EX", 10).catch(() => {});
      }

      // Build OHLC candles from every tick
      updateCandles(inst.symbol, nextBid, nextAsk);

      // SLOW PATH: Update DB every 2 seconds (10 ticks @ 200ms)
      if (tickCount % 10 === 0) {
        return prisma.instrument.update({
          where: { id: inst.id },
          data: { bid: nextBid, ask: nextAsk },
        });
      }
    });

    await Promise.all(updatePromises.filter(p => p !== undefined));
  } catch (error) {
    logger.error("[WebSocket] Error in tickAllInstruments:", error);
  }
}

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: "/ws" });
  wssRef = wss;

  // Faster tick interval: 200ms
  const tickInterval = setInterval(tickAllInstruments, 200);

  // Instant Chart Updates for Binance Symbols
  priceService.on('price', (tick) => {
    updateCandles(tick.symbol, tick.bid, tick.ask);
  });

  wss.on("connection", (ws) => {
    const subscriptions = new Set();
    ws.isAlive = true;
    ws.userId = null;

    ws.send(JSON.stringify({ type: "connected", message: "Connected to Exness price feed" }));

    ws.on("pong", () => { ws.isAlive = true; });

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw);

        // Allow client to identify itself for targeted notifications
        if (msg.type === "auth" && msg.userId) {
          ws.userId = msg.userId;
        }

        if (msg.type === "subscribe" && Array.isArray(msg.symbols)) {
          msg.symbols.forEach((s) => subscriptions.add(s.toUpperCase()));
          const snapshot = {};
          subscriptions.forEach((s) => { if (priceCache.has(s)) snapshot[s] = priceCache.get(s); });
          ws.send(JSON.stringify({ type: "snapshot", data: snapshot }));
        }

        if (msg.type === "unsubscribe" && Array.isArray(msg.symbols)) {
          msg.symbols.forEach((s) => subscriptions.delete(s.toUpperCase()));
        }

        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        }
      } catch (_) {}
    });

    let lastPayloadStr = "";
    const feedInterval = setInterval(() => {
      if (ws.readyState !== WebSocket.OPEN) return clearInterval(feedInterval);
      if (subscriptions.size === 0) return;
      
      const payload = {};
      let hasChanges = false;
      
      subscriptions.forEach((s) => { 
        if (priceCache.has(s)) {
          payload[s] = priceCache.get(s);
        }
      });
      
      const currentPayloadStr = JSON.stringify(payload);
      if (currentPayloadStr !== lastPayloadStr) {
        ws.send(JSON.stringify({ type: "prices", data: payload }));
        lastPayloadStr = currentPayloadStr;
      }
    }, 100); // 100ms throttled batching

    ws.on("close", () => clearInterval(feedInterval));
    ws.on("error", () => clearInterval(feedInterval));
  });

  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(tickInterval);
    clearInterval(heartbeat);
  });

  logger.info("WebSocket price feed initialized at /ws");
  return wss;
}

module.exports = { setupWebSocket, pushToUser, priceCache };
