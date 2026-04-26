const { prisma } = require("../config/prisma");

function toInt(value, fallback, { min = 1, max = 100 } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

function buildPagination(page, limit, total) {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 0,
  };
}

function notFound(message) {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

async function getAdminSummary() {
  const [
    totalUsers,
    activeUsers,
    liveAccounts,
    demoAccounts,
    openPositions,
    pendingDeposits,
    pendingWithdrawals,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.tradingAccount.count({ where: { accountType: "LIVE" } }),
    prisma.tradingAccount.count({ where: { accountType: "DEMO" } }),
    prisma.position.count({ where: { status: "OPEN" } }),
    prisma.walletTransaction.count({ where: { type: "DEPOSIT", status: "PENDING" } }),
    prisma.walletTransaction.count({ where: { type: "WITHDRAWAL", status: "PENDING" } }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    totalUsers,
    activeUsers,
    liveAccounts,
    demoAccounts,
    openPositions,
    pendingDeposits,
    pendingWithdrawals,
    recentAuditLogs,
  };
}

async function listUsers(query = {}) {
  const page = toInt(query.page, 1, { min: 1, max: Number.MAX_SAFE_INTEGER });
  const limit = toInt(query.limit, 20, { min: 1, max: 100 });
  const skip = (page - 1) * limit;

  const where = {
    ...(query.search
      ? {
          OR: [
            { email: { contains: query.search, mode: "insensitive" } },
            { firstName: { contains: query.search, mode: "insensitive" } },
            { lastName: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(query.role ? { role: query.role } : {}),
    ...(query.kycStatus ? { kycStatus: query.kycStatus } : {}),
    ...(query.isActive !== undefined
      ? { isActive: String(query.isActive).toLowerCase() === "true" }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        country: true,
        role: true,
        kycStatus: true,
        isActive: true,
        isEmailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: {
            tradingAccounts: true,
            wallets: true,
            walletTransactions: true,
          },
        },
        wallets: {
          where: { isPrimary: true },
          take: 1,
          select: {
            id: true,
            currency: true,
            type: true,
            balance: true,
            credit: true,
            isPrimary: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items,
    pagination: buildPagination(page, limit, total),
  };
}

async function getUserDetail(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      country: true,
      role: true,
      kycStatus: true,
      isEmailVerified: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      wallets: {
        orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
      },
      tradingAccounts: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          accountNumber: true,
          accountType: true,
          platform: true,
          leverage: true,
          baseCurrency: true,
          status: true,
          balance: true,
          equity: true,
          margin: true,
          freeMargin: true,
          marginLevel: true,
          canTrade: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              orders: true,
              positions: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw notFound("User not found");
  }

  const [recentWalletTransactions, withdrawalRequests] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        fee: true,
        reference: true,
        description: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.walletTransaction.findMany({
      where: {
        userId,
        type: "WITHDRAWAL",
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        fee: true,
        reference: true,
        description: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    ...user,
    recentWalletTransactions,
    withdrawalRequests,
  };
}

async function updateKycStatus(userId, { status, reviewNote }, admin) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, kycStatus: true },
  });

  if (!user) {
    throw notFound("User not found");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { kycStatus: status },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin?.id || null,
      actorEmail: admin?.email || null,
      action: "KYC_STATUS_UPDATE",
      entityType: "User",
      entityId: userId,
      description: `KYC status changed to ${status}.`,
      metadata: {
        previousStatus: user.kycStatus,
        newStatus: status,
        reviewNote: reviewNote || null,
      },
    },
  });

  return updated;
}

async function toggleUserActive(userId, admin) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, isActive: true },
  });

  if (!user) {
    throw notFound("User not found");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });

  await prisma.auditLog.create({
    data: {
      userId: admin?.id || null,
      actorEmail: admin?.email || null,
      action: user.isActive ? "USER_DEACTIVATED" : "USER_ACTIVATED",
      entityType: "User",
      entityId: userId,
      description: `User ${user.email} ${user.isActive ? "deactivated" : "activated"}.`,
    },
  });

  return updated;
}

async function listPendingWithdrawals(query = {}) {
  const page = toInt(query.page, 1, { min: 1, max: Number.MAX_SAFE_INTEGER });
  const limit = toInt(query.limit, 20, { min: 1, max: 100 });
  const skip = (page - 1) * limit;

  const where = {
    type: "WITHDRAWAL",
    status: "PENDING",
  };

  const [items, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "asc" },
      include: {
        wallet: {
          select: {
            id: true,
            currency: true,
            type: true,
            balance: true,
            credit: true,
            isPrimary: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                kycStatus: true,
                isActive: true,
              },
            },
          },
        },
        tradingAccount: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
            platform: true,
            baseCurrency: true,
            status: true,
          },
        },
      },
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return {
    items,
    pagination: buildPagination(page, limit, total),
  };
}

async function processWithdrawal(transactionId, action, admin) {
  const tx = await prisma.walletTransaction.findUnique({
    where: { id: transactionId },
    include: {
      wallet: {
        select: {
          id: true,
          currency: true,
          balance: true,
          credit: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!tx || tx.type !== "WITHDRAWAL" || tx.status !== "PENDING") {
    throw notFound("Pending withdrawal not found");
  }

  const nextStatus = action === "APPROVE" ? "COMPLETED" : "REJECTED";

  const updated = await prisma.$transaction(async (db) => {
    const result = await db.walletTransaction.update({
      where: { id: transactionId },
      data: {
        status: nextStatus,
        description:
          action === "REJECT"
            ? tx.description || "Withdrawal request rejected by admin"
            : tx.description || "Withdrawal request approved by admin",
      },
    });

    await db.auditLog.create({
      data: {
        userId: admin?.id || null,
        actorEmail: admin?.email || null,
        action: `WITHDRAWAL_${action}`,
        entityType: "WalletTransaction",
        entityId: transactionId,
        description: `Withdrawal ${action === "APPROVE" ? "approved" : "rejected"} for ${tx.amount} ${tx.wallet.currency}.`,
        metadata: {
          amount: tx.amount,
          walletId: tx.walletId,
          userId: tx.userId,
          previousStatus: tx.status,
          newStatus: nextStatus,
        },
      },
    });

    return result;
  });

  return updated;
}

async function listAllPositions(query = {}) {
  const page = toInt(query.page, 1, { min: 1, max: Number.MAX_SAFE_INTEGER });
  const limit = toInt(query.limit, 20, { min: 1, max: 100 });
  const skip = (page - 1) * limit;
  const where = {
    ...(query.status ? { status: query.status } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.position.findMany({
      where,
      skip,
      take: limit,
      orderBy: { openedAt: "desc" },
      include: {
        instrument: { select: { symbol: true, displayName: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        tradingAccount: { select: { accountNumber: true, accountType: true } },
      },
    }),
    prisma.position.count({ where }),
  ]);

  return {
    items,
    pagination: buildPagination(page, limit, total),
  };
}

async function getAuditLogs(query = {}) {
  const page = toInt(query.page, 1, { min: 1, max: Number.MAX_SAFE_INTEGER });
  const limit = toInt(query.limit, 20, { min: 1, max: 100 });
  const skip = (page - 1) * limit;
  const where = {
    ...(query.entityType ? { entityType: query.entityType } : {}),
    ...(query.action ? { action: query.action } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    items,
    pagination: buildPagination(page, limit, total),
  };
}

module.exports = {
  getAdminSummary,
  listUsers,
  getUserDetail,
  updateKycStatus,
  toggleUserActive,
  listPendingWithdrawals,
  processWithdrawal,
  listAllPositions,
  getAuditLogs,
};
