const jwt = require("jsonwebtoken");

const { env } = require("../config/env");

function signAccessToken(user) {
  return jwt.sign(
    { role: user.role, email: user.email },
    env.jwtSecret,
    {
      subject: user.id,
      expiresIn: env.jwtExpiresIn,
    },
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { tokenType: "refresh" },
    env.jwtRefreshSecret,
    {
      subject: user.id,
      expiresIn: env.jwtRefreshExpiresIn,
    },
  );
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
