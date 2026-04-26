const prisma = require('../config/prisma')
const { success, error } = require('../utils/response')
const bcrypt = require('bcryptjs')
const userService = require('./user.service')

const getProfile = async (req, res) => {
  try {
    const user = await userService.getProfile(req.user.id)
    return success(res, user)
  } catch (err) {
    return error(res, err.message)
  }
}

const updateProfile = async (req, res) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body)
    return success(res, user, 'Profile updated')
  } catch (err) {
    return error(res, err.message)
  }
}

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user.id } })

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return error(res, 'Current password is incorrect', 400)

    const hashed = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } })
    await prisma.refreshToken.deleteMany({ where: { userId: req.user.id } })

    return success(res, null, 'Password changed. Please login again.')
  } catch (err) {
    return error(res, err.message)
  }
}

const submitKyc = async (req, res) => {
  try {
    const { documents } = req.body // [{ type, fileUrl }]

    await prisma.kycDocument.createMany({
      data: documents.map((d) => ({ ...d, userId: req.user.id })),
    })

    await prisma.user.update({
      where: { id: req.user.id },
      data: { kycStatus: 'SUBMITTED' },
    })

    return success(res, null, 'KYC documents submitted for review')
  } catch (err) {
    return error(res, err.message)
  }
}

const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return success(res, notifications)
  } catch (err) {
    return error(res, err.message)
  }
}

const markNotificationRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, id: req.params.id },
      data: { isRead: true },
    })
    return success(res, null, 'Notification marked as read')
  } catch (err) {
    return error(res, err.message)
  }
}

module.exports = { getProfile, updateProfile, changePassword, submitKyc, getNotifications, markNotificationRead }
