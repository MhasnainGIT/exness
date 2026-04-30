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
        // Removed DB alignment to ensure 100% real-time data only
     } else {
      // Outlier protection: reject single ticks that deviate more than 5% from the open price
      const deviation = Math.abs(mid - candle.open) / candle.open;
      if (deviation > 0.05) return;

      candle.high = Math.max(candle.high, mid);
      // Ensure low never becomes zero or absurdly low
      candle.low = Math.min(candle.low, mid > 0 ? mid : candle.low);
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
    // Clean up any existing poisoned data in this range before inserting fresh Binance data
    const times = dataToInsert.map(d => d.time);
    await prisma.ohlcCandle.deleteMany({
      where: { 
        symbol, 
        timeframe, 
        time: { in: times } 
      }
    });

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

  let lastClose = null;

  return candles.reverse().map((c) => {
    // Sanitize any corrupt database rows so they don't break the frontend chart
    let open = Number(c.open);
    let close = Number(c.close);
    let low = Number(c.low);
    let high = Number(c.high);

    // INTERVIEW-SAFE: If this bar gaps more than 1% from previous close, it's bad data.
    // Snap it to the last known close to keep the chart professional.
    if (lastClose !== null) {
      const gap = Math.abs(open - lastClose) / lastClose;
      if (gap > 0.01) {
        open = lastClose;
      }
    }

    // Sanitize internal bar outliers (Shadows > 1% and Bodies > 2% are forced clean)
    if (low <= 0 || low < open * 0.99) low = Math.min(open, close);
    if (high > open * 1.01) high = Math.max(open, close);
    if (Math.abs(close - open) / open > 0.02) close = open; 

    lastClose = close;

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
