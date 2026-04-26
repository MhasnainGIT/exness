const bcrypt = require("bcryptjs");

const { prisma } = require("../config/prisma");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");

async function ensurePrimaryWallet(userId, currency = "USD") {
  const existing = await prisma.wallet.findFirst({
    where: { userId, currency, isPrimary: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.wallet.create({
    data: {
      userId,
      currency,
      type: "FIAT",
      balance: 0,
      credit: 0,
      isPrimary: true,
    },
  });
}

async function createSession(user, meta) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  if (meta.replaceToken) {
    await prisma.session.deleteMany({
      where: { refreshToken: meta.replaceToken },
    });
  }

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
      expiresAt,
      ipAddress: meta.ipAddress || null,
      userAgent: meta.userAgent || null,
    },
  });

  return { accessToken, refreshToken };
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    country: user.country,
    phone: user.phone,
    kycStatus: user.kycStatus,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

async function registerUser(payload, meta) {
  const email = payload.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phone: payload.phone || null,
      country: payload.country || null,
    },
  });

  const wallet = await ensurePrimaryWallet(user.id);
  const tokens = await createSession(user, meta);

  return { user: sanitizeUser(user), wallet, tokens };
}

async function loginUser(payload, meta) {
  const user = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase() },
  });

  if (!user || !(await bcrypt.compare(payload.password, user.passwordHash))) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const wallet = await ensurePrimaryWallet(user.id);
  const tokens = await createSession(user, meta);

  return { user: sanitizeUser(user), wallet, tokens };
}

async function refreshUserSession(refreshToken) {
  const payload = verifyRefreshToken(refreshToken);
  const session = await prisma.session.findUnique({
    where: { refreshToken },
    include: { user: true },
  });

  if (!session || session.userId !== payload.sub || session.expiresAt < new Date()) {
    const error = new Error("Refresh token is invalid or expired");
    error.statusCode = 401;
    throw error;
  }

  const tokens = await createSession(session.user, {
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
    replaceToken: refreshToken,
  });

  return { user: sanitizeUser(session.user), tokens };
}

async function logoutUser(refreshToken) {
  await prisma.session.deleteMany({
    where: { refreshToken },
  });
}

module.exports = {
  ensurePrimaryWallet,
  sanitizeUser,
  registerUser,
  loginUser,
  refreshUserSession,
  logoutUser,
};
