const { prisma } = require("../config/prisma");
const { roundPrice } = require("../utils/number");

const TIMEFRAMES = {
  "1M":  60,
  "5M":  300,
  "15M": 900,
  "30M": 1800,
  "1H":  3600,
  "4H":  14400,
  "1D":  86400,
};

function getBarTime(timestamp, tfSeconds) {
  const ms = tfSeconds * 1000;
  return new Date(Math.floor(timestamp / ms) * ms);
}

const candleBuffer = new Map();

setInterval(async () => {
  const candlesToFlush = Array.from(candleBuffer.values()).filter(c => c.isDirty);
  for (const c of candlesToFlush) c.isDirty = false;

  for (const c of candlesToFlush) {
     try {
        await prisma.ohlcCandle.upsert({
           where: { symbol_timeframe_time: { symbol: c.symbol, timeframe: c.timeframe, time: c.time } },
           update: {
              high: c.high,
              low: c.low,
              close: c.close,
              volume: c.volume
           },
           create: {
              symbol: c.symbol,
              timeframe: c.timeframe,
              time: c.time,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
              volume: c.volume
           }
        });
     } catch (err) {
        // Fallback silently. If it failed, it will just retry next dirty cycle if new ticks arrive
     }
  }
}, 5000);

// Called every second from the price engine with latest bid/ask per symbol
function updateCandles(symbol, bid, ask) {
  const mid = roundPrice((bid + ask) / 2, 5);
  const now = Date.now();

  for (const [tf, seconds] of Object.entries(TIMEFRAMES)) {
    const barTime = getBarTime(now, seconds);
    const key = `${symbol}_${tf}`;

    let candle = candleBuffer.get(key);
    
    if (!candle || candle.time.getTime() !== barTime.getTime()) {
       candle = { 
         symbol, timeframe: tf, time: barTime, 
         open: mid, high: mid, low: mid, close: mid, volume: 1,
         isDirty: true
       };
       candleBuffer.set(key, candle);

       // Async fetch from DB to align if the candle was already created by Binance sync
       prisma.ohlcCandle.findUnique({
          where: { symbol_timeframe_time: { symbol, timeframe: tf, time: barTime } }
       }).then(existing => {
          if (existing && candleBuffer.get(key) === candle) {
             candle.open = Number(existing.open);
             candle.high = Math.max(Number(existing.high), candle.high);
             candle.low = Math.min(Number(existing.low), candle.low);
             candle.volume = existing.volume + candle.volume;
             candle.isDirty = true;
          }
       }).catch(() => {});
    } else {
      candle.high = Math.max(candle.high, mid);
      candle.low = Math.min(candle.low, mid);
      candle.close = mid;
      candle.volume += 1;
      candle.isDirty = true;
    }
  }
  return {};
}

/**
 * Bulk insert historical candles (e.g. from Binance)
 * @param {string} symbol 
 * @param {string} timeframe 
 * @param {Array} candles - Array of { time, open, high, low, close, volume }
 */
async function bulkUpsertCandles(symbol, timeframe, candles) {
  if (!candles || candles.length === 0) return;
  
  const dataToInsert = candles.map(c => ({
    symbol,
    timeframe,
    time: new Date(c.time * 1000),
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume
  }));

  try {
    // createMany with skipDuplicates is magnitudes faster than sequential upserts
    await prisma.ohlcCandle.createMany({
      data: dataToInsert,
      skipDuplicates: true,
    });
  } catch (e) {
    console.error(`Error bulk inserting candles ${symbol} ${timeframe}:`, e.message);
  }
}

async function getCandles(symbol, timeframe = "1H", limit = 200) {
  const tf = TIMEFRAMES[timeframe] ? timeframe : "1H";
  const candles = await prisma.ohlcCandle.findMany({
    where: { symbol: symbol.toUpperCase(), timeframe: tf },
    orderBy: { time: "desc" },
    take: Math.min(Number(limit), 500),
  });

  return candles.reverse().map((c) => ({
    time: Math.floor(new Date(c.time).getTime() / 1000),
    open:   Number(c.open),
    high:   Number(c.high),
    low:    Number(c.low),
    close:  Number(c.close),
    volume: c.volume,
  }));
}

module.exports = { updateCandles, getCandles, bulkUpsertCandles, TIMEFRAMES };
