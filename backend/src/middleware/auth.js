const { verifyAccessToken } = require('../utils/jwt')
const { error } = require('../utils/response')
const prisma = require('../config/prisma')

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) return error(res, 'No token provided', 401)

    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true, kycStatus: true },
    })

    if (!user || !user.isActive) return error(res, 'Unauthorized', 401)

    req.user = user
    next()
  } catch (err) {
    return error(res, 'Invalid or expired token', 401)
  }
}

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return error(res, 'Forbidden', 403)
  next()
}

module.exports = { authenticate, authorize }
