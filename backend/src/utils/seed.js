require("dotenv").config();

const bcrypt = require("bcryptjs");
const { Prisma } = require("@prisma/client");
const { prisma } = require("../config/prisma");

const instruments = [
  // FOREX
  { symbol: "EURUSD", displayName: "EUR/USD", type: "FOREX", baseCurrency: "EUR", quoteCurrency: "USD", contractSize: 100000, minLot: 0.01, maxLot: 200, lotStep: 0.01, leverageCap: 2000, marginRequirement: 0.05, spread: 0.00007, bid: 1.08420, ask: 1.08427 },
  { symbol: "GBPUSD", displayName: "GBP/USD", type: "FOREX", baseCurrency: "GBP", quoteCurrency: "USD", contractSize: 100000, minLot: 0.01, maxLot: 200, lotStep: 0.01, leverageCap: 2000, marginRequirement: 0.05, spread: 0.00009, bid: 1.26500, ask: 1.26509 },
  { symbol: "USDJPY", displayName: "USD/JPY", type: "FOREX", baseCurrency: "USD", quoteCurrency: "JPY", contractSize: 100000, minLot: 0.01, maxLot: 200, lotStep: 0.01, leverageCap: 2000, marginRequirement: 0.05, spread: 0.009, bid: 149.500, ask: 149.509 },
  { symbol: "USDCHF", displayName: "USD/CHF", type: "FOREX", baseCurrency: "USD", quoteCurrency: "CHF", contractSize: 100000, minLot: 0.01, maxLot: 200, lotStep: 0.01, leverageCap: 2000, marginRequirement: 0.05, spread: 0.00008, bid: 0.89500, ask: 0.89508 },
  { symbol: "AUDUSD", displayName: "AUD/USD", type: "FOREX", baseCurrency: "AUD", quoteCurrency: "USD", contractSize: 100000, minLot: 0.01, maxLot: 200, lotStep: 0.01, leverageCap: 2000, marginRequirement: 0.05, spread: 0.00008, bid: 0.65500, ask: 0.65508 },
  { symbol: "USDCAD", displayName: "USD/CAD", type: "FOREX", baseCurrency: "USD", quoteCurrency: "CAD", contractSize: 100000, minLot: 0.01, maxLot: 200, lotStep: 0.01, leverageCap: 2000, marginRequirement: 0.05, spread: 0.00010, bid: 1.35500, ask: 1.35510 },
  { symbol: "NZDUSD", displayName: "NZD/USD", type: "FOREX", baseCurrency: "NZD", quoteCurrency: "USD", contractSize: 100000, minLot: 0.01, maxLot: 200, lotStep: 0.01, leverageCap: 2000, marginRequirement: 0.05, spread: 0.00011, bid: 0.61500, ask: 0.61511 },
  { symbol: "EURGBP", displayName: "EUR/GBP", type: "FOREX", baseCurrency: "EUR", quoteCurrency: "GBP", contractSize: 100000, minLot: 0.01, maxLot: 200, lotStep: 0.01, leverageCap: 2000, marginRequirement: 0.05, spread: 0.00008, bid: 0.85800, ask: 0.85808 },
  { symbol: "EURJPY", displayName: "EUR/JPY", type: "FOREX", baseCurrency: "EUR", quoteCurrency: "JPY", contractSize: 100000, minLot: 0.01, maxLot: 200, lotStep: 0.01, leverageCap: 2000, marginRequirement: 0.05, spread: 0.012, bid: 162.100, ask: 162.112 },
  { symbol: "GBPJPY", displayName: "GBP/JPY", type: "FOREX", baseCurrency: "GBP", quoteCurrency: "JPY", contractSize: 100000, minLot: 0.01, maxLot: 200, lotStep: 0.01, leverageCap: 2000, marginRequirement: 0.05, spread: 0.015, bid: 189.200, ask: 189.215 },
  { symbol: "EURCHF", displayName: "EUR/CHF", type: "FOREX", baseCurrency: "EUR", quoteCurrency: "CHF", contractSize: 100000, minLot: 0.01, maxLot: 200, lotStep: 0.01, leverageCap: 2000, marginRequirement: 0.05, spread: 0.00010, bid: 0.96800, ask: 0.96810 },
  { symbol: "AUDCAD", displayName: "AUD/CAD", type: "FOREX", baseCurrency: "AUD", quoteCurrency: "CAD", contractSize: 100000, minLot: 0.01, maxLot: 200, lotStep: 0.01, leverageCap: 2000, marginRequirement: 0.05, spread: 0.00015, bid: 0.89200, ask: 0.89215 },
  // METALS
  { symbol: "XAUUSD", displayName: "Gold / USD", type: "METAL", baseCurrency: "XAU", quoteCurrency: "USD", contractSize: 100, minLot: 0.01, maxLot: 50, lotStep: 0.01, leverageCap: 400, marginRequirement: 0.25, spread: 0.35, bid: 2324.80, ask: 2325.15 },
  { symbol: "XAGUSD", displayName: "Silver / USD", type: "METAL", baseCurrency: "XAG", quoteCurrency: "USD", contractSize: 5000, minLot: 0.01, maxLot: 100, lotStep: 0.01, leverageCap: 400, marginRequirement: 0.25, spread: 0.025, bid: 27.450, ask: 27.475 },
  { symbol: "XPTUSD", displayName: "Platinum / USD", type: "METAL", baseCurrency: "XPT", quoteCurrency: "USD", contractSize: 100, minLot: 0.01, maxLot: 50, lotStep: 0.01, leverageCap: 200, marginRequirement: 0.5, spread: 1.5, bid: 980.50, ask: 982.00 },
  // CRYPTO
  { symbol: "BTCUSD", displayName: "Bitcoin / USD", type: "CRYPTO", baseCurrency: "BTC", quoteCurrency: "USD", contractSize: 1, minLot: 0.01, maxLot: 10, lotStep: 0.01, leverageCap: 100, marginRequirement: 1, spread: 18.5, bid: 68450.20, ask: 68468.70 },
  { symbol: "ETHUSD", displayName: "Ethereum / USD", type: "CRYPTO", baseCurrency: "ETH", quoteCurrency: "USD", contractSize: 1, minLot: 0.01, maxLot: 50, lotStep: 0.01, leverageCap: 100, marginRequirement: 1, spread: 3.5, bid: 3520.00, ask: 3523.50 },
  { symbol: "LTCUSD", displayName: "Litecoin / USD", type: "CRYPTO", baseCurrency: "LTC", quoteCurrency: "USD", contractSize: 1, minLot: 0.01, maxLot: 100, lotStep: 0.01, leverageCap: 50, marginRequirement: 2, spread: 0.25, bid: 85.00, ask: 85.25 },
  { symbol: "XRPUSD", displayName: "Ripple / USD", type: "CRYPTO", baseCurrency: "XRP", quoteCurrency: "USD", contractSize: 1, minLot: 1, maxLot: 100000, lotStep: 1, leverageCap: 50, marginRequirement: 2, spread: 0.002, bid: 0.520, ask: 0.522 },
  { symbol: "ADAUSD", displayName: "Cardano / USD", type: "CRYPTO", baseCurrency: "ADA", quoteCurrency: "USD", contractSize: 1, minLot: 1, maxLot: 100000, lotStep: 1, leverageCap: 50, marginRequirement: 2, spread: 0.001, bid: 0.450, ask: 0.451 },
  { symbol: "SOLUSD", displayName: "Solana / USD", type: "CRYPTO", baseCurrency: "SOL", quoteCurrency: "USD", contractSize: 1, minLot: 0.1, maxLot: 1000, lotStep: 0.1, leverageCap: 50, marginRequirement: 2, spread: 0.15, bid: 145.00, ask: 145.15 },
  // INDICES
  { symbol: "US30", displayName: "Dow Jones 30", type: "INDEX", baseCurrency: "USD", quoteCurrency: "USD", contractSize: 1, minLot: 0.1, maxLot: 100, lotStep: 0.1, leverageCap: 200, marginRequirement: 0.5, spread: 3.0, bid: 38500.0, ask: 38503.0 },
  { symbol: "US500", displayName: "S&P 500", type: "INDEX", baseCurrency: "USD", quoteCurrency: "USD", contractSize: 1, minLot: 0.1, maxLot: 100, lotStep: 0.1, leverageCap: 200, marginRequirement: 0.5, spread: 0.5, bid: 5100.0, ask: 5100.5 },
  { symbol: "NAS100", displayName: "NASDAQ 100", type: "INDEX", baseCurrency: "USD", quoteCurrency: "USD", contractSize: 1, minLot: 0.1, maxLot: 100, lotStep: 0.1, leverageCap: 200, marginRequirement: 0.5, spread: 1.0, bid: 17800.0, ask: 17801.0 },
  { symbol: "UK100", displayName: "FTSE 100", type: "INDEX", baseCurrency: "GBP", quoteCurrency: "GBP", contractSize: 1, minLot: 0.1, maxLot: 100, lotStep: 0.1, leverageCap: 200, marginRequirement: 0.5, spread: 1.5, bid: 8200.0, ask: 8201.5 },
  { symbol: "GER40", displayName: "DAX 40", type: "INDEX", baseCurrency: "EUR", quoteCurrency: "EUR", contractSize: 1, minLot: 0.1, maxLot: 100, lotStep: 0.1, leverageCap: 200, marginRequirement: 0.5, spread: 2.0, bid: 18200.0, ask: 18202.0 },
  { symbol: "FRA40", displayName: "CAC 40", type: "INDEX", baseCurrency: "EUR", quoteCurrency: "EUR", contractSize: 1, minLot: 0.1, maxLot: 100, lotStep: 0.1, leverageCap: 200, marginRequirement: 0.5, spread: 2.0, bid: 8050.0, ask: 8052.0 },
  { symbol: "JPN225", displayName: "Nikkei 225", type: "INDEX", baseCurrency: "JPY", quoteCurrency: "JPY", contractSize: 1, minLot: 0.1, maxLot: 100, lotStep: 0.1, leverageCap: 200, marginRequirement: 0.5, spread: 10.0, bid: 38800.0, ask: 38810.0 },
  // ENERGY
  { symbol: "USOIL", displayName: "WTI Crude Oil", type: "ENERGY", baseCurrency: "USD", quoteCurrency: "USD", contractSize: 1000, minLot: 0.01, maxLot: 100, lotStep: 0.01, leverageCap: 200, marginRequirement: 0.5, spread: 0.04, bid: 78.50, ask: 78.54 },
  { symbol: "UKOIL", displayName: "Brent Crude Oil", type: "ENERGY", baseCurrency: "USD", quoteCurrency: "USD", contractSize: 1000, minLot: 0.01, maxLot: 100, lotStep: 0.01, leverageCap: 200, marginRequirement: 0.5, spread: 0.05, bid: 82.30, ask: 82.35 },
  { symbol: "NATGAS", displayName: "Natural Gas", type: "ENERGY", baseCurrency: "USD", quoteCurrency: "USD", contractSize: 10000, minLot: 0.01, maxLot: 100, lotStep: 0.01, leverageCap: 100, marginRequirement: 1, spread: 0.003, bid: 2.150, ask: 2.153 },
];

async function upsertUser({ email, role, firstName, lastName, password, country }) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { role, firstName, lastName, country, passwordHash, isEmailVerified: true, isActive: true, kycStatus: role === "ADMIN" ? "VERIFIED" : "PENDING" },
    create: { email, role, firstName, lastName, country, passwordHash, isEmailVerified: true, isActive: true, kycStatus: role === "ADMIN" ? "VERIFIED" : "PENDING" },
  });
}

async function ensureWallet(userId, balance) {
  return prisma.wallet.upsert({
    where: { userId_currency_type: { userId, currency: "USD", type: "FIAT" } },
    update: { balance: new Prisma.Decimal(balance), isPrimary: true },
    create: { userId, currency: "USD", type: "FIAT", balance: new Prisma.Decimal(balance), credit: 0, isPrimary: true },
  });
}

async function ensureTradingAccount(userId, walletId, accountNumber, accountType, balance, leverage) {
  return prisma.tradingAccount.upsert({
    where: { accountNumber },
    update: { userId, walletId, accountType, leverage, baseCurrency: "USD", balance: new Prisma.Decimal(balance), equity: new Prisma.Decimal(balance), freeMargin: new Prisma.Decimal(balance), margin: 0, marginLevel: 0, canTrade: true },
    create: { userId, walletId, accountNumber, accountType, leverage, platform: "webtrader", baseCurrency: "USD", balance: new Prisma.Decimal(balance), equity: new Prisma.Decimal(balance), freeMargin: new Prisma.Decimal(balance), margin: 0, marginLevel: 0, canTrade: true },
  });
}

async function seed() {
  console.log("Seeding instruments...");
  for (const instrument of instruments) {
    const created = await prisma.instrument.upsert({
      where: { symbol: instrument.symbol },
      update: instrument,
      create: instrument,
    });
    await prisma.priceTick.create({
      data: { instrumentId: created.id, symbol: created.symbol, bid: created.bid, ask: created.ask, spread: created.spread, source: "seed" },
    });
  }
  console.log(`Seeded ${instruments.length} instruments`);

  const admin = await upsertUser({ email: "admin@trading.local", role: "ADMIN", firstName: "Platform", lastName: "Admin", password: "Admin@12345", country: "AE" });
  const trader = await upsertUser({ email: "demo.trader@trading.local", role: "USER", firstName: "Demo", lastName: "Trader", password: "Trader@12345", country: "IN" });

  const adminWallet = await ensureWallet(admin.id, 50000);
  const traderWallet = await ensureWallet(trader.id, 15000);

  await ensureTradingAccount(admin.id, adminWallet.id, "90000001", "LIVE", 25000, 500);
  await ensureTradingAccount(trader.id, traderWallet.id, "90000002", "DEMO", 10000, 1000);
  await ensureTradingAccount(trader.id, traderWallet.id, "90000003", "LIVE", 5000, 400);

  await prisma.auditLog.create({
    data: { userId: admin.id, actorEmail: admin.email, action: "SEED_EXECUTED", entityType: "System", entityId: "seed", description: "Initial seed completed" },
  });

  console.log("Seed completed");
  console.log("Admin: admin@trading.local / Admin@12345");
  console.log("Trader: demo.trader@trading.local / Trader@12345");
}

seed()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (error) => { console.error("Seed failed", error); await prisma.$disconnect(); process.exit(1); });
