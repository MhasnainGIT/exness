const WebSocket = require('ws');
const EventEmitter = require('events');
const axios = require('axios'); // Note: if axios is not available, I'll use fetch
const { updateCandles, bulkUpsertCandles } = require('../ohlc/ohlc.service');
const eventBus = require('./eventBus');
const logger = require('../utils/logger');

// Map internal symbols to Binance symbols
const SYMBOL_MAP = {
  'BTCUSD': 'BTCUSDT',
  'ETHUSD': 'ETHUSDT',
  'BNBUSD': 'BNBUSDT',
  'SOLUSD': 'SOLUSDT',
  'XRPUSD': 'XRPUSDT',
  'ADAUSD': 'ADAUSDT',
  'DOTUSD': 'DOTUSDT',
  'DOGEUSD': 'DOGEUSDT',
};

// Inverse map for incoming messages
const INVERSE_SYMBOL_MAP = Object.fromEntries(
  Object.entries(SYMBOL_MAP).map(([k, v]) => [v, k])
);

class PriceService extends EventEmitter {
  constructor() {
    super();
    this.livePrices = new Map();
    this.sockets = new Map();
    this.subscribedSymbols = new Set();
    this.reconnectInterval = 5000;
    this.apiKey = process.env.BINANCE_API_KEY;
    this.apiSecret = process.env.BINANCE_SECRET_KEY;
    this.priceCache = null; // Will be set by market/websocket.js
  }

  setPriceCache(cache) {
    this.priceCache = cache;
  }

  /**
   * Fetch historical klines from Binance and seed the database
   */
  async fetchHistory(symbol, timeframe = '1m', limit = 500) {
    const binanceSymbol = SYMBOL_MAP[symbol] || symbol;
    const internalTf = timeframe === '1m' ? '1M' : (timeframe === '1h' ? '1H' : '1D');
    
    try {
      console.log(`[PriceService] Fetching history for ${symbol} (${binanceSymbol}) ...`);
      const url = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${timeframe}&limit=${limit}`;
      // Use axios properly here, no API key required for public klines
      const { data } = await axios.get(url);

      if (!Array.isArray(data)) {
         throw new Error(`Invalid response from Binance: ${JSON.stringify(data)}`);
      }

      const candles = data.map(d => ({
        time: Math.floor(d[0] / 1000),
        open: parseFloat(d[1]),
        high: parseFloat(d[2]),
        low: parseFloat(d[3]),
        close: parseFloat(d[4]),
        volume: parseFloat(d[5])
      }));

      await bulkUpsertCandles(symbol, internalTf, candles);
      console.log(`[PriceService] Seeded ${candles.length} historical candles for ${symbol}`);
    } catch (error) {
      console.error(`[PriceService] Failed to fetch history for ${symbol}:`, error.message);
    }
  }

  connect(symbol) {
    const binanceSymbol = SYMBOL_MAP[symbol] || symbol;
    const upperSymbol = binanceSymbol.toUpperCase();
    const internalSymbol = INVERSE_SYMBOL_MAP[upperSymbol] || symbol;
    
    if (this.sockets.has(upperSymbol)) return;

    // Fetch history first (overwriting 1000 bars to ensure we clean up all bad data)
    this.fetchHistory(internalSymbol, '1m', 1000);
    this.fetchHistory(internalSymbol, '1h', 100);

    const streams = [
      `${binanceSymbol.toLowerCase()}@kline_1m`,
      `${binanceSymbol.toLowerCase()}@trade`,
      `${binanceSymbol.toLowerCase()}@ticker`
    ];
    
    const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        console.log(`[PriceService] Connected to Binance: ${upperSymbol} -> ${internalSymbol}`);
        this.subscribedSymbols.add(upperSymbol);
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(internalSymbol, message);
        } catch (error) {
          console.error(`[PriceService] Error parsing message for ${upperSymbol}:`, error.message);
        }
      });

      ws.on('close', () => {
        this.sockets.delete(upperSymbol);
        this.subscribedSymbols.delete(upperSymbol);
        setTimeout(() => this.connect(symbol), this.reconnectInterval);
      });

      this.sockets.set(upperSymbol, ws);
    } catch (error) {
      console.error(`[PriceService] Failed connection to ${upperSymbol}:`, error.message);
    }
  }

  handleMessage(symbol, message) {
    if (!message.stream || !message.data) return;
    const data = message.data;
    let priceData;

    if (message.stream.includes('@ticker')) {
      priceData = {
        symbol,
        bid: parseFloat(data.b),
        ask: parseFloat(data.a),
        price: parseFloat(data.c),
        timestamp: Date.now()
      };

      // SANITIZATION: Drop bad websocket ticks (zeros or NaNs) immediately
      if (!priceData.bid || !priceData.ask || isNaN(priceData.bid) || priceData.bid <= 0) {
        console.warn(`[PriceService] Rejected zero/invalid tick for ${symbol}`);
        return;
      }

      // Outlier Protection: Reject flash spikes > 5% comparing bid to last known good price
      const lastKnown = this.getLivePrice(symbol);
      if (lastKnown && lastKnown.bid > 0) {
         const change = Math.abs(priceData.bid - lastKnown.bid) / lastKnown.bid;
         if (change > 0.05) {
            console.warn(`[PriceService] Rejected outlier tick for ${symbol}: ${priceData.bid} (was ${lastKnown.bid}, ${ (change*100).toFixed(2)}% change)`);
            return; 
         }
      }

      // Propagate to WebSocket cache if available
      if (this.priceCache) {
        this.priceCache.set(symbol, {
          symbol,
          bid: priceData.bid,
          ask: priceData.ask,
          spread: parseFloat((priceData.ask - priceData.bid).toFixed(5)),
          timestamp: priceData.timestamp
        });
      }

      // Update candles periodically
      updateCandles(symbol, priceData.bid, priceData.ask);
      
      // Publish to Redis for event-driven architecture
      eventBus.publish(`price:${symbol}`, priceData);
      eventBus.publish('price_updates', priceData);
    } else if (message.stream.includes('@trade')) {
       // Optional: more granular updates
    }

    if (priceData) {
      this.livePrices.set(symbol, priceData);
      this.emit('priceUpdate', priceData);
      this.emit(`price:${symbol}`, priceData);
    }
  }

  getLivePrice(symbol) {
    return this.livePrices.get(symbol.toUpperCase()) || null;
  }

  getExecutionPrice(symbol, side, spreadPercent = 0.05) {
    const priceData = this.getLivePrice(symbol);
    if (!priceData) throw new Error(`No price for ${symbol}`);

    const basePrice = priceData.price || priceData.bid || priceData.ask;
    return side === 'BUY' ? (priceData.ask || basePrice * (1 + spreadPercent/100)) : (priceData.bid || basePrice * (1 - spreadPercent/100));
  }

  disconnectAll() {
    for (const ws of this.sockets.values()) ws.close();
    this.sockets.clear();
    this.subscribedSymbols.clear();
  }
}

const priceService = new PriceService();
module.exports = priceService;
module.exports.SYMBOL_MAP = SYMBOL_MAP;
