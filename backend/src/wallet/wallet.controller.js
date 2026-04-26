const { asyncHandler } = require("../utils/asyncHandler");
const walletService = require("./wallet.service");

const getWallet = asyncHandler(async (req, res) => {
  const data = await walletService.getWallet(req.user.id);
  res.json({ success: true, data });
});

const deposit = asyncHandler(async (req, res) => {
  const data = await walletService.requestDeposit(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

const withdraw = asyncHandler(async (req, res) => {
  const data = await walletService.requestWithdrawal(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

const transfer = asyncHandler(async (req, res) => {
  const data = await walletService.transferToTradingAccount(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

const getTransactions = asyncHandler(async (req, res) => {
  const data = await walletService.listTransactions(req.user.id, req.query);
  res.json({ success: true, data });
});

module.exports = { getWallet, deposit, withdraw, transfer, getTransactions };
