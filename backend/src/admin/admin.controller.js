const { asyncHandler } = require("../utils/asyncHandler");
const adminService = require("./admin.service");

const adminSummaryController = asyncHandler(async (_req, res) => {
  const data = await adminService.getAdminSummary();
  res.json({ success: true, data });
});

const listUsersController = asyncHandler(async (req, res) => {
  const data = await adminService.listUsers(req.query);
  res.json({ success: true, data });
});

const getUserDetailController = asyncHandler(async (req, res) => {
  const data = await adminService.getUserDetail(req.params.userId);
  res.json({ success: true, data });
});

const updateKycController = asyncHandler(async (req, res) => {
  const data = await adminService.updateKycStatus(req.params.userId, req.body, req.user);
  res.json({ success: true, data });
});

const toggleUserController = asyncHandler(async (req, res) => {
  const data = await adminService.toggleUserActive(req.params.userId, req.user);
  res.json({ success: true, data });
});

const listWithdrawalsController = asyncHandler(async (req, res) => {
  const data = await adminService.listPendingWithdrawals(req.query);
  res.json({ success: true, data });
});

const processWithdrawalController = asyncHandler(async (req, res) => {
  const data = await adminService.processWithdrawal(req.params.txId, req.body.action, req.user);
  res.json({ success: true, data });
});

const listPositionsController = asyncHandler(async (req, res) => {
  const data = await adminService.listAllPositions(req.query);
  res.json({ success: true, data });
});

const auditLogsController = asyncHandler(async (req, res) => {
  const data = await adminService.getAuditLogs(req.query);
  res.json({ success: true, data });
});

module.exports = {
  adminSummaryController,
  listUsersController,
  getUserDetailController,
  updateKycController,
  toggleUserController,
  listWithdrawalsController,
  processWithdrawalController,
  listPositionsController,
  auditLogsController,
};
