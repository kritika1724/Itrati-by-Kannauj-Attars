const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { isAdminEmail } = require('../config/admin')

const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    const token = auth.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // Block refresh tokens from being used as access tokens.
    if (decoded?.typ && decoded.typ !== 'access') {
      return res.status(401).json({ message: 'Token invalid' })
    }
    const user = await User.findById(decoded.id).select('_id name email').lean()

    if (!user) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    // Never trust DB flags for admin. Derive admin strictly from env-based email.
    user.isAdmin = isAdminEmail(user.email)
    user.role = user.isAdmin ? 'admin' : 'user'

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Token invalid' })
  }
}

const optionalProtect = async (req, _res, next) => {
  try {
    const auth = req.headers.authorization
    if (!auth || !auth.startsWith('Bearer ')) {
      return next()
    }

    const token = auth.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (decoded?.typ && decoded.typ !== 'access') {
      return next()
    }

    const user = await User.findById(decoded.id).select('_id name email').lean()
    if (!user) {
      return next()
    }

    user.isAdmin = isAdminEmail(user.email)
    user.role = user.isAdmin ? 'admin' : 'user'
    req.user = user
    return next()
  } catch {
    return next()
  }
}

const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' })
  if (isAdminEmail(req.user.email)) return next()
  return res.status(403).json({ message: 'Admin only access' })
}

// Backward-compatible alias (existing routes import adminOnly).
const adminOnly = isAdmin

module.exports = { protect, optionalProtect, isAdmin, adminOnly }
