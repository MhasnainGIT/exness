const { asyncHandler } = require("../utils/asyncHandler");
const accountService = require("./account.service");

const create = asyncHandler(async (req, res) => {
  const data = await accountService.createAccount(req.user.id, req.body);
  res.status(201).json({ success: true, data });
});

const list = asyncHandler(async (req, res) => {
  const data = await accountService.getAccountSummary(req.user.id);
  res.json({ success: true, data });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await accountService.getAccount(req.user.id, req.params.accountId);
  res.json({ success: true, data });
});

const updateLeverage = asyncHandler(async (req, res) => {
  const data = await accountService.updateLeverage(req.user.id, req.params.accountId, req.body.leverage);
  res.json({ success: true, data });
});

const archiveAccount = asyncHandler(async (req, res) => {
  const data = await accountService.archiveAccount(req.user.id, req.params.accountId);
  res.json({ success: true, data });
});

const restoreAccount = asyncHandler(async (req, res) => {
  const data = await accountService.restoreAccount(req.user.id, req.params.accountId);
  res.json({ success: true, data });
});

module.exports = { create, list, getOne, updateLeverage, renameAccount, archiveAccount, restoreAccount };
