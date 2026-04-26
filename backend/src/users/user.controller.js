const { asyncHandler } = require("../utils/asyncHandler");
const userService = require("./user.service");

const getMe = asyncHandler(async (req, res) => {
  const data = await userService.getProfile(req.user.id);
  res.json({ success: true, data });
});

const getDashboard = asyncHandler(async (req, res) => {
  const data = await userService.getDashboardProfile(req.user.id);
  res.json({ success: true, data });
});

const updateMe = asyncHandler(async (req, res) => {
  const data = await userService.updateProfile(req.user.id, req.body);
  res.json({ success: true, data });
});

const changePassword = asyncHandler(async (req, res) => {
  const data = await userService.changePassword(req.user.id, req.body);
  res.json({ success: true, data });
});

const submitKyc = asyncHandler(async (req, res) => {
  const data = await userService.submitKyc(req.user.id, req.body.documents);
  res.json({ success: true, data });
});

module.exports = { getMe, getDashboard, updateMe, changePassword, submitKyc };
