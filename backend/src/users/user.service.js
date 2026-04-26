const bcrypt = require("bcryptjs");
const { prisma } = require("../config/prisma");
const { ensurePrimaryWallet, sanitizeUser } = require("../auth/auth.service");

async function getProfile(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  const wallet = await ensurePrimaryWallet(userId);
  return { ...sanitizeUser(user), wallet };
}

async function updateProfile(userId, payload) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone === undefined ? undefined : payload.phone || null,
      country: payload.country === undefined ? undefined : payload.country || null,
    },
  });
  const wallet = await ensurePrimaryWallet(userId);
  return { ...sanitizeUser(user), wallet };
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    const error = new Error("Current password is incorrect");
    error.statusCode = 400;
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
    prisma.session.deleteMany({ where: { userId } }),
  ]);

  return { message: "Password changed. All sessions invalidated." };
}

async function submitKyc(userId, documents) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user.kycStatus === "VERIFIED") {
    const error = new Error("KYC already verified");
    error.statusCode = 400;
    throw error;
  }

  await prisma.$transaction([
    prisma.auditLog.create({
      data: {
        userId,
        action: "KYC_SUBMITTED",
        entityType: "User",
        entityId: userId,
        description: `KYC documents submitted: ${documents.map((d) => d.type).join(", ")}`,
        metadata: { documents },
      },
    }),
    prisma.user.update({ where: { id: userId }, data: { kycStatus: "PENDING" } }),
  ]);

  return { message: "KYC documents submitted for review" };
}

async function getDashboardProfile(userId) {
  const [profile, accountCount, wallet, openPositions] = await Promise.all([
    getProfile(userId),
    prisma.tradingAccount.count({ where: { userId } }),
    ensurePrimaryWallet(userId),
    prisma.position.count({ where: { userId, status: "OPEN" } }),
  ]);

  return {
    ...profile,
    stats: { accountCount, openPositions, walletBalance: wallet.balance },
  };
}

module.exports = { getProfile, updateProfile, changePassword, submitKyc, getDashboardProfile };
