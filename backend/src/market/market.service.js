const { prisma } = require("../config/prisma");
const { roundPrice } = require("../utils/number");

function createSyntheticTick(instrument) {
  const bid = Number(instrument.bid);
  const spread = Number(instrument.spread);
  const drift = (Math.random() - 0.5) * spread * 0.6;
  const nextBid = roundPrice(Math.max(0.00001, bid + drift));
  const nextAsk = roundPrice(nextBid + spread);
  return { bid: nextBid, ask: nextAsk, spread: roundPrice(nextAsk - nextBid) };
}

async function listInstruments(type) {
  return prisma.instrument.findMany({
    where: { isActive: true, ...(type && { type }) },
    orderBy: [{ type: "asc" }, { symbol: "asc" }],
  });
}

async function getInstrument(symbol) {
  const instrument = await prisma.instrument.findUnique({ where: { symbol: symbol.toUpperCase() } });
  if (!instrument) {
    const error = new Error("Instrument not found");
    error.statusCode = 404;
    throw error;
  }
  return instrument;
}

async function getLatestTicks(symbol) {
  return prisma.priceTick.findMany({
    where: symbol ? { symbol: symbol.toUpperCase() } : undefined,
    orderBy: { timestamp: "desc" },
    take: symbol ? 1 : 20,
  });
}

async function refreshSyntheticPrices() {
  const instruments = await prisma.instrument.findMany({ where: { isActive: true } });

  await Promise.all(
    instruments.map(async (instrument) => {
      const tick = createSyntheticTick(instrument);
      await prisma.$transaction([
        prisma.instrument.update({
          where: { id: instrument.id },
          data: { bid: tick.bid, ask: tick.ask, spread: tick.spread },
        }),
        prisma.priceTick.create({
          data: {
            instrumentId: instrument.id,
            symbol: instrument.symbol,
            bid: tick.bid,
            ask: tick.ask,
            spread: tick.spread,
            source: "synthetic",
          },
        }),
      ]);
    }),
  );

  return getLatestTicks();
}

const ohlcService = require("../ohlc/ohlc.service");

// Generate mock OHLCV candles (FALLBACK ONLY if DB is empty)
function generateCandles(symbol, timeframe, limit) {
  const basePrices = {
    EURUSD: 1.0842, GBPUSD: 1.2650, USDJPY: 149.50, USDCHF: 0.8950,
    AUDUSD: 0.6550, USDCAD: 1.3550, NZDUSD: 0.6150, EURGBP: 0.8580,
    EURJPY: 162.10, GBPJPY: 189.20, XAUUSD: 2324.80, XAGUSD: 27.45,
    XPTUSD: 980.50, BTCUSD: 68450.0, ETHUSD: 3520.0, LTCUSD: 85.0,
    XRPUSD: 0.52, US30: 38500, US500: 5100, NAS100: 17800,
    UK100: 8200, GER40: 18200, USOIL: 78.50, UKOIL: 82.30,
  };

  const base = basePrices[symbol.toUpperCase()] || 1.0;
  const tfMs = { "1M": 60000, "5M": 300000, "15M": 900000, "30M": 1800000, "1H": 3600000, "4H": 14400000, "1D": 86400000 };
  const ms = tfMs[timeframe] || 3600000;
  const volatility = base * 0.0008;

  const candles = [];
  let time = Date.now() - limit * ms;
  let price = base;

  for (let i = 0; i < limit; i++) {
    const open = price;
    const change = (Math.random() - 0.5) * volatility * 2;
    const close = roundPrice(Math.max(0.00001, open + change));
    const high = roundPrice(Math.max(open, close) + Math.random() * volatility);
    const low = roundPrice(Math.min(open, close) - Math.random() * volatility);
    const volume = Math.floor(Math.random() * 5000) + 500;
    candles.push({ time: Math.floor(time / 1000), open, high, low, close, volume });
    price = close;
    time += ms;
  }
  return candles;
}

async function getCandles(symbol, timeframe = "1H", limit = 200) {
  // 1. Try to get from database first (Real/Persisted data)
  let candles = await ohlcService.getCandles(symbol, timeframe, limit);
  
  // 2. Fallback to generator if database is empty (for better UX on first run)
  if (candles.length < 5) {
     console.log(`[MarketService] Database has only ${candles.length} candles for ${symbol}. Providing fallback data.`);
     return generateCandles(symbol, timeframe, limit);
  }

  return candles;
}

module.exports = { listInstruments, getInstrument, getLatestTicks, refreshSyntheticPrices, getCandles };
