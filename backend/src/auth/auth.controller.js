const { asyncHandler } = require("../utils/asyncHandler");
const {
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
} = require("./auth.service");

function requestMeta(req) {
  return {
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  };
}

const register = asyncHandler(async (req, res) => {
  const data = await registerUser(req.body, requestMeta(req));
  res.status(201).json({ success: true, data });
});

const login = asyncHandler(async (req, res) => {
  const data = await loginUser(req.body, requestMeta(req));
  res.json({ success: true, data });
});

const refresh = asyncHandler(async (req, res) => {
  const data = await refreshUserSession(req.body.refreshToken);
  res.json({ success: true, data });
});

const logout = asyncHandler(async (req, res) => {
  await logoutUser(req.body.refreshToken);
  res.json({ success: true, message: "Logged out successfully" });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
};
