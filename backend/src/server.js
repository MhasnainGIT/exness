require("dotenv").config();

const http = require("http");
const { app } = require("./app");
const { env } = require("./config/env");
const { prisma } = require("./config/prisma");
const { setupWebSocket } = require("./market/websocket");
const { initTradingSocket } = require("./sockets/tradingSocket");
const priceService = require("./services/priceService");
const { startEngines, stopEngines } = require("./jobs/tradingEngines");
const riskService = require("./services/riskService");
const eventBus = require("./services/eventBus");
const logger = require("./utils/logger");

async function bootstrap() {
  await prisma.$connect();
  logger.info("Database connected");

  const server = http.createServer(app);

  setupWebSocket(server);
  initTradingSocket(server);
  
  // Connect to Binance for top crypto pairs
  const symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'DOTUSDT'];
  symbols.forEach(s => priceService.connect(s));
  
  startEngines();
  riskService.startMonitoring();

  server.listen(env.port, () => {
    logger.info(`Backend listening on port ${env.port}`);
    logger.info(`Health: http://localhost:${env.port}/health`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    
    // Stop all background jobs immediately
    stopEngines();
    riskService.stopMonitoring();
    priceService.disconnectAll();
    await eventBus.stop();

    server.close(async () => {
      logger.info("HTTP server closed.");
      await prisma.$disconnect();
      logger.info("Database disconnected.");
      process.exit(0);
    });

    // Force shutdown after 3s (reduced from 10s for better dev experience)
    setTimeout(() => {
      logger.error("Forcefully shutting down.");
      process.exit(1);
    }, 3000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch(async (error) => {
  console.error("Failed to bootstrap backend", error);
  await prisma.$disconnect();
  process.exit(1);
});
