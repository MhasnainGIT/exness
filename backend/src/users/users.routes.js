const router = require('express').Router()
const { body } = require('express-validator')
const {
  getProfile, updateProfile, changePassword,
  submitKyc, getNotifications, markNotificationRead,
} = require('./users.controller')
const { authenticate } = require('../middleware/auth')
const validate = require('../middleware/validate')

router.use(authenticate)

router.get('/profile', getProfile)
router.patch('/profile', [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phone').optional().isMobilePhone(),
  validate,
], updateProfile)

router.post('/change-password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
  validate,
], changePassword)

router.post('/kyc', [
  body('documents').isArray({ min: 1 }),
  body('documents.*.type').isIn(['passport', 'national_id', 'utility_bill', 'bank_statement']),
  body('documents.*.fileUrl').isURL(),
  validate,
], submitKyc)

router.get('/notifications', getNotifications)
router.patch('/notifications/:id/read', markNotificationRead)

module.exports = router
