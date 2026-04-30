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
  const [accounts, openPositions] = await Promise.all([
    listAccounts(userId),
    prisma.position.findMany({
      where: { userId, status: "OPEN" },
      include: { instrument: true },
    }),
  ]);

  const accountsWithLiveEquity = accounts.map((account) => {
    const accPositions = openPositions.filter((p) => p.tradingAccountId === account.id);
    const floatingPnl = accPositions.reduce((sum, p) => {
      const exit = p.side === "BUY" ? Number(p.instrument.bid) : Number(p.instrument.ask);
      const points = p.side === "BUY" ? exit - Number(p.openPrice) : Number(p.openPrice) - exit;
      return sum + points * Number(p.volumeLots) * Number(p.instrument.contractSize);
    }, 0);

    const liveEquity = Number(account.balance) + floatingPnl;
    const freeMargin = liveEquity - Number(account.margin);
    const marginLevel = Number(account.margin) === 0 ? 0 : (liveEquity / Number(account.margin)) * 100;

    return {
      ...account,
      equity: liveEquity,
      floatingPnl,
      freeMargin,
      marginLevel,
    };
  });

  const totals = accountsWithLiveEquity.reduce(
    (acc, curr) => ({
      balance: acc.balance + Number(curr.balance),
      equity: acc.equity + curr.equity,
      margin: acc.margin + Number(curr.margin),
      freeMargin: acc.freeMargin + curr.freeMargin,
    }),
    { balance: 0, equity: 0, margin: 0, freeMargin: 0 }
  );

  return {
    accounts: accountsWithLiveEquity,
    totals: {
      ...totals,
      accountCount: accounts.length,
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

const archiveAccount = async (userId, accountId) => {
  const account = await prisma.tradingAccount.findFirst({ where: { id: accountId, userId } });
  if (!account) {
    const error = new Error("Account not found");
    error.statusCode = 404;
    throw error;
  }

  const openPositions = await prisma.position.count({ where: { tradingAccountId: accountId, status: "OPEN" } });
  if (openPositions > 0) {
    const error = new Error("Cannot archive account while positions are open");
    error.statusCode = 400;
    throw error;
  }

  return prisma.tradingAccount.update({ where: { id: accountId }, data: { status: "CLOSED", canTrade: false } });
};

const restoreAccount = async (userId, accountId) => {
  const account = await prisma.tradingAccount.findFirst({ where: { id: accountId, userId } });
  if (!account) {
    const error = new Error("Account not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.tradingAccount.update({ where: { id: accountId }, data: { status: "ACTIVE", canTrade: true } });
};

const setBalance = async (userId, accountId, balance) => {
  const account = await prisma.tradingAccount.findFirst({ where: { id: accountId, userId } });
  if (!account) {
    const error = new Error("Account not found");
    error.statusCode = 404;
    throw error;
  }

  if (account.accountType !== "DEMO") {
    const error = new Error("Balance can only be manually set for DEMO accounts");
    error.statusCode = 400;
    throw error;
  }

  return prisma.tradingAccount.update({
    where: { id: accountId },
    data: { balance, equity: balance, freeMargin: balance },
  });
};

module.exports = { createAccount, listAccounts, getAccount, updateLeverage, renameAccount, archiveAccount, restoreAccount, setBalance, getAccountSummary };
