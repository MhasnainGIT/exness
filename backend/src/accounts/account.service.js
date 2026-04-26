const { prisma } = require("../config/prisma");
const { ensurePrimaryWallet } = require("../auth/auth.service");

const VALID_LEVERAGES = [1, 2, 5, 10, 25, 50, 100, 200, 400, 500, 1000, 2000];

const generateAccountNumber = async () => {
  for (let i = 0; i < 10; i++) {
    const accountNumber = `${Math.floor(10000000 + Math.random() * 90000000)}`;
    const existing = await prisma.tradingAccount.findUnique({ where: { accountNumber }, select: { id: true } });
    if (!existing) return accountNumber;
  }
  const error = new Error("Unable to generate account number");
  error.statusCode = 500;
  throw error;
};

const createAccount = async (userId, payload) => {
  const wallet = await ensurePrimaryWallet(userId, payload.baseCurrency || "USD");
  const accountNumber = await generateAccountNumber();
  const accountType = payload.accountType || "DEMO";
  const openingBalance = accountType === "DEMO" ? 10000 : 0;

  return prisma.tradingAccount.create({
    data: {
      userId,
      walletId: wallet.id,
      accountNumber,
      accountType,
      platform: payload.platform || "webtrader",
      leverage: payload.leverage || 200,
      baseCurrency: payload.baseCurrency || wallet.currency,
      balance: openingBalance,
      equity: openingBalance,
      margin: 0,
      freeMargin: openingBalance,
      marginLevel: 0,
    },
  });
};

const listAccounts = async (userId) =>
  prisma.tradingAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true, positions: true, transactions: true } } },
  });

const getAccount = async (userId, accountId) => {
  const account = await prisma.tradingAccount.findFirst({
    where: { id: accountId, userId },
    include: {
      _count: { select: { orders: true, positions: true } },
      positions: {
        where: { status: "OPEN" },
        include: { instrument: { select: { symbol: true, displayName: true, bid: true, ask: true } } },
        take: 10,
      },
    },
  });
  if (!account) {
    const error = new Error("Account not found");
    error.statusCode = 404;
    throw error;
  }
  return account;
};

const updateLeverage = async (userId, accountId, leverage) => {
  if (!VALID_LEVERAGES.includes(Number(leverage))) {
    const error = new Error(`Invalid leverage. Valid values: ${VALID_LEVERAGES.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  const account = await prisma.tradingAccount.findFirst({ where: { id: accountId, userId } });
  if (!account) {
    const error = new Error("Account not found");
    error.statusCode = 404;
    throw error;
  }

  const openPositions = await prisma.position.count({ where: { tradingAccountId: accountId, status: "OPEN" } });
  if (openPositions > 0) {
    const error = new Error("Cannot change leverage while positions are open");
    error.statusCode = 400;
    throw error;
  }

  return prisma.tradingAccount.update({ where: { id: accountId }, data: { leverage: Number(leverage) } });
};

const getAccountSummary = async (userId) => {
  const [accounts, totals] = await Promise.all([
    listAccounts(userId),
    prisma.tradingAccount.aggregate({
      where: { userId },
      _sum: { balance: true, equity: true, margin: true, freeMargin: true },
      _count: { id: true },
    }),
  ]);

  return {
    accounts,
    totals: {
      accountCount: totals._count.id,
      balance: totals._sum.balance || 0,
      equity: totals._sum.equity || 0,
      margin: totals._sum.margin || 0,
      freeMargin: totals._sum.freeMargin || 0,
    },
  };
};

const renameAccount = async (userId, accountId, name) => {
  const account = await prisma.tradingAccount.findFirst({ where: { id: accountId, userId } });
  if (!account) {
    const error = new Error("Account not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.tradingAccount.update({ where: { id: accountId }, data: { name } });
};

module.exports = { createAccount, listAccounts, getAccount, updateLeverage, renameAccount, getAccountSummary };
