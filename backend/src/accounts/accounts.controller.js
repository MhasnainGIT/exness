const { success, error } = require('../utils/response')
const accountService = require('./account.service')

const getAccounts = async (req, res) => {
  try {
    const accounts = await accountService.listAccounts(req.user.id)
    return success(res, accounts)
  } catch (err) {
    return error(res, err.message)
  }
}

const createAccount = async (req, res) => {
  try {
    const account = await accountService.createAccount(req.user.id, req.body)
    return success(res, account, 'Account created', 201)
  } catch (err) {
    return error(res, err.message)
  }
}

const getAccount = async (req, res) => {
  try {
    const account = await accountService.getAccount(req.user.id, req.params.id)
    if (!account) return error(res, 'Account not found', 404)
    return success(res, account)
  } catch (err) {
    return error(res, err.message)
  }
}

const updateLeverage = async (req, res) => {
  try {
    const { leverage } = req.body
    const updated = await accountService.updateLeverage(req.user.id, req.params.id, leverage)
    return success(res, updated, 'Leverage updated')
  } catch (err) {
    return error(res, err.message, err.statusCode || 500)
  }
}

module.exports = { getAccounts, createAccount, getAccount, updateLeverage }
