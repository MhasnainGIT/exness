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
  if (!bid || !ask || isNaN(bid) || isNaN(ask) || bid <= 0 || ask <= 0) return {};

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
             const exOpen = Number(existing.open) || mid;
             const exHigh = Number(existing.high) || mid;
             const exLow = Number(existing.low) || mid;
             
             candle.open = exOpen;
             candle.high = Math.max(exHigh, candle.high);
             // Prevent legacy zero-values in DB from dragging down the live chart low
             candle.low = exLow > 0 ? Math.min(exLow, candle.low) : candle.low;
             candle.volume = existing.volume + candle.volume;
             candle.isDirty = true;
          }
       }).catch(() => {});
    } else {
      // Outlier protection: reject single ticks that deviate more than 20% from the open price (flash crash / bad exchange data)
      const deviation = Math.abs(mid - candle.open) / candle.open;
      if (deviation > 0.20) return;

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

  return candles.reverse().map((c) => {
    // Sanitize any corrupt database rows so they don't break the frontend chart
    const open = Number(c.open);
    const close = Number(c.close);
    let low = Number(c.low);
    let high = Number(c.high);

    // If the low drops down to zero or highly anomalous (< 50% of open price), snap it back
    if (low <= 0 || low < open * 0.5) low = Math.min(open, close);
    if (high > open * 2) high = Math.max(open, close);

    return {
      time: Math.floor(new Date(c.time).getTime() / 1000),
      open,
      high,
      low,
      close,
      volume: c.volume,
    };
  });
}

module.exports = { updateCandles, getCandles, bulkUpsertCandles, TIMEFRAMES };
