const { asyncHandler } = require("../utils/asyncHandler");
const marketService = require("./market.service");
const { getCandles } = require("../ohlc/ohlc.service");

const listInstrumentsController = asyncHandler(async (req, res) => {
  const data = await marketService.listInstruments(req.query.type);
  res.json({ success: true, data });
});

const getInstrumentController = asyncHandler(async (req, res) => {
  const data = await marketService.getInstrument(req.params.symbol);
  res.json({ success: true, data });
});

const getTicksController = asyncHandler(async (req, res) => {
  const data = await marketService.getLatestTicks(req.query.symbol);
  res.json({ success: true, data });
});

const refreshTicksController = asyncHandler(async (_req, res) => {
  const data = await marketService.refreshSyntheticPrices();
  res.json({ success: true, data });
});

const getCandlesController = asyncHandler(async (req, res) => {
  const { symbol } = req.params;
  const { timeframe = "1H", limit = 200 } = req.query;
  // Use real DB candles; fall back to generated if DB not populated yet
  let data = await getCandles(symbol.toUpperCase(), timeframe, limit);
  if (data.length < 10) {
    data = await marketService.getCandles(symbol, timeframe, limit);
  }
  res.json({ success: true, data });
});

module.exports = {
  listInstrumentsController,
  getInstrumentController,
  getTicksController,
  refreshTicksController,
  getCandlesController,
};
