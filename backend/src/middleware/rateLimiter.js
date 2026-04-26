const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis").default;
const { redis } = require("../config/redis");
const logger = require("../utils/logger");

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: process.env.NODE_ENV === 'development' ? 10000 : 600,
  standardHeaders: true,
  legacyHeaders: false,
  store: (redis && process.env.NODE_ENV === 'production') ? new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }) : undefined, 
  skip: (req) => {
    // Skip rate limiting for health checks
    if (req.path === '/health') return true;
    // Keep rate limiting enabled in dev for parity, but with higher limit
    return false;
  },
  handler: (req, res, _next) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many requests, please slow down",
    });
  },
});

module.exports = { apiLimiter };
