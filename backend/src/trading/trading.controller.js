const { asyncHandler } = require("../utils/asyncHandler");
const tradingService = require("./trading.service");

const placeOrderController = asyncHandler(async (req, res) => {
  const data = await tradingService.placeOrder({
    userId: req.user.id,
    tradingAccountId: req.body.tradingAccountId,
    instrumentSymbol: req.body.instrumentSymbol,
    side: req.body.side,
    type: req.body.type || "MARKET",
    volumeLots: req.body.volumeLots,
    stopLoss: req.body.stopLoss,
    takeProfit: req.body.takeProfit,
  });
  res.status(201).json({ success: true, data });
});

const listPositionsController = asyncHandler(async (req, res) => {
  const data = await tradingService.listOpenPositions(req.user.id, req.query.accountId);
  res.json({ success: true, data });
});

const closePositionController = asyncHandler(async (req, res) => {
  const data = await tradingService.closePosition({ userId: req.user.id, positionId: req.params.positionId });
  res.json({ success: true, data });
});

const modifyPositionController = asyncHandler(async (req, res) => {
  const data = await tradingService.modifyPosition({
    userId: req.user.id,
    positionId: req.params.positionId,
    stopLoss: req.body.stopLoss,
    takeProfit: req.body.takeProfit,
  });
  res.json({ success: true, data });
});

const orderHistoryController = asyncHandler(async (req, res) => {
  const data = await tradingService.getOrderHistory(req.user.id, req.query);
  res.json({ success: true, data });
});

const listPositionHistoryController = asyncHandler(async (req, res) => {
  const data = await tradingService.listPositionHistory(req.user.id, req.query.accountId);
  res.json({ success: true, data });
});

const tradingOverviewController = asyncHandler(async (req, res) => {
  const data = await tradingService.getTradingOverview(req.user.id);
  res.json({ success: true, data });
});

const cancelOrderController = asyncHandler(async (req, res) => {
  const data = await tradingService.cancelOrder({ userId: req.user.id, orderId: req.params.orderId });
  res.json({ success: true, data });
});

const createAccountController = asyncHandler(async (req, res) => {
  const data = await tradingService.createTradingAccount(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

module.exports = {
  placeOrderController,
  listPositionsController,
  closePositionController,
  modifyPositionController,
  orderHistoryController,
  tradingOverviewController,
  listPositionHistoryController,
  cancelOrderController,
  createAccountController,
};
