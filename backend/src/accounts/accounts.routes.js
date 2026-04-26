const router = require('express').Router()
const { body } = require('express-validator')
const { getAccounts, createAccount, getAccount, updateLeverage } = require('./accounts.controller')
const { authenticate } = require('../middleware/auth')
const validate = require('../middleware/validate')

router.use(authenticate)

router.get('/', getAccounts)
router.post('/', [
  body('type').optional().isIn(['STANDARD', 'PRO', 'ZERO', 'RAW_SPREAD']),
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'BTC', 'ETH']),
  body('leverage').optional().isInt({ min: 1, max: 5000 }),
  validate,
], createAccount)
router.get('/:id', getAccount)
router.patch('/:id/leverage', [
  body('leverage').isInt({ min: 1, max: 5000 }),
  validate,
], updateLeverage)

module.exports = router
