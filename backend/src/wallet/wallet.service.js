const { v4: uuidv4 } = require("uuid");
const { prisma } = require("../config/prisma");
const { ensurePrimaryWallet } = require("../auth/auth.service");

const transactionSelect = {
  id: true,
  type: true,
  amount: true,
  status: true,
  reference: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
};

const getWallet = async (userId) => {
  const wallet = await ensurePrimaryWallet(userId);
  const recentTransactions = await prisma.walletTransaction.findMany({
    where: {
      walletId: wallet.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    select: transactionSelect,
  });

  return {
    wallet,
    recentTransactions,
  };
};

const listTransactions = async (userId, query = {}) => {
  const wallet = await ensurePrimaryWallet(userId);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const where = {
    walletId: wallet.id,
  };

  if (query.type) {
    where.type = query.type;
  }

  if (query.status) {
    where.status = query.status;
  }

  const [items, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: transactionSelect,
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

const createRequest = async (userId, payload, type) => {
  const wallet = await ensurePrimaryWallet(userId);

  if (type === "WITHDRAWAL" && Number(payload.amount) > Number(wallet.balance)) {
    const error = new Error("Insufficient wallet balance");
    error.statusCode = 400;
    throw error;
  }

  return prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      userId,
      type,
      amount: payload.amount,
      status: "PENDING",
      reference: `${type.slice(0, 3)}-${Date.now()}-${uuidv4().split('-')[0]}`,
      metadata: {
        paymentMethod: payload.paymentMethod,
        ...(payload.metadata || {}),
      },
    },
    select: transactionSelect,
  });
};

const requestDeposit = async (userId, payload) => createRequest(userId, payload, "DEPOSIT");

const requestWithdrawal = async (userId, payload) => createRequest(userId, payload, "WITHDRAWAL");

async function transferToTradingAccount(userId, payload) {
  const wallet = await ensurePrimaryWallet(userId);
  const account = await prisma.tradingAccount.findFirst({
    where: { id: payload.toAccountId, userId },
  });

  if (!account) {
    const error = new Error("Trading account not found");
    error.statusCode = 404;
    throw error;
  }

  if (Number(payload.amount) > Number(wallet.balance)) {
    const error = new Error("Insufficient wallet balance");
    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: { decrement: payload.amount },
      },
    });

    const updatedAccount = await tx.tradingAccount.update({
      where: { id: account.id },
      data: {
        balance: { increment: payload.amount },
        equity: { increment: payload.amount },
        freeMargin: { increment: payload.amount },
      },
    });

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId,
        tradingAccountId: account.id,
        type: "INTERNAL_TRANSFER",
        status: "COMPLETED",
        amount: payload.amount,
        reference: `TRF-${Date.now()}-${uuidv4().split("-")[0]}`,
        metadata: {
          toAccountId: account.id,
        },
      },
      select: transactionSelect,
    });

    return { wallet: updatedWallet, account: updatedAccount, transaction };
  });
}

module.exports = {
  getWallet,
  listTransactions,
  requestDeposit,
  requestWithdrawal,
  transferToTradingAccount,
};
