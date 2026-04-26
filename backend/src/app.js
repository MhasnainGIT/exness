const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const { env } = require("./config/env");
const { redis } = require("./config/redis");
const { prisma } = require("./config/prisma");
const { apiLimiter } = require("./middleware/rateLimiter");
const { notFoundHandler } = require("./middleware/notFound");
const { errorHandler } = require("./middleware/errorHandler");
const { authRoutes } = require("./auth/auth.routes");
const { userRoutes } = require("./users/user.routes");
const { walletRoutes } = require("./wallet/wallet.routes");
const { accountRoutes } = require("./accounts/account.routes");
const { marketRoutes } = require("./market/market.routes");
const { tradingRoutes } = require("./trading/trading.routes");
const { notificationRoutes } = require("./notifications/notification.routes");
const { adminRoutes } = require("./admin/admin.routes");


const app = express();

app.use(
  cors({
    origin: [env.clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use("/api", apiLimiter);

app.get("/health", async (_req, res) => {
  const dbStatus = await prisma.$queryRaw`SELECT 1`.then(() => 'UP').catch(() => 'DOWN');
  const redisStatus = redis ? (redis.status === 'ready' ? 'UP' : 'DOWN') : 'N/A';

  res.json({
    success: true,
    status: (dbStatus === 'UP' && (redisStatus === 'UP' || redisStatus === 'N/A')) ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus,
      redis: redisStatus,
    },
    environment: env.nodeEnv,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/trading", tradingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = { app };
