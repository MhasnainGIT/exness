const { prisma } = require("../config/prisma");

async function createNotification(userId, { title, message, type, metadata }) {
  return prisma.notification.create({
    data: { userId, title, message, type, metadata: metadata || null },
  });
}

async function createForAll(userIds, payload) {
  return prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, ...payload })),
  });
}

async function listNotifications(userId, { page = 1, limit = 30 } = {}) {
  const skip = (page - 1) * limit;
  const [items, total, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);
  return { items, unread, pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) } };
}

async function markRead(userId, notificationId) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

async function markAllRead(userId) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

module.exports = { createNotification, createForAll, listNotifications, markRead, markAllRead };
