const { asyncHandler } = require("../utils/asyncHandler");
const notifService = require("./notification.service");

const list = asyncHandler(async (req, res) => {
  const data = await notifService.listNotifications(req.user.id, req.query);
  res.json({ success: true, data });
});

const readOne = asyncHandler(async (req, res) => {
  await notifService.markRead(req.user.id, req.params.id);
  res.json({ success: true });
});

const readAll = asyncHandler(async (req, res) => {
  await notifService.markAllRead(req.user.id);
  res.json({ success: true });
});

module.exports = { list, readOne, readAll };
