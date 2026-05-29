const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { isAdminEmail } = require('../config/admin')
const { getRefreshCookieOptions } = require('../config/cookies')
const { signAccessToken, signRefreshToken, hashToken, refreshExpiryDate } = require('../config/tokens')
const asyncHandler = require('../utils/asyncHandler')
const { sessionRefreshLimiter } = require('../utils/rateLimit')

const router = express.Router()

const COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refreshToken'

const clearCookie = (res) => {
  // Clear cookie with matching options/path.
  res.clearCookie(COOKIE_NAME, { ...getRefreshCookieOptions() })
}

const setCookie = (res, token) => {
  const expires = refreshExpiryDate()
  res.cookie(COOKIE_NAME, token, { ...getRefreshCookieOptions(), expires })
}

const userPayload = (user) => {
  const admin = isAdminEmail(user.email)
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: admin,
    role: admin ? 'admin' : 'user',
  }
}

// Refresh access token using httpOnly refresh cookie (rotates refresh token)
router.post('/refresh', sessionRefreshLimiter, asyncHandler(async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) return res.status(401).json({ message: 'Not authorized' })

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    clearCookie(res)
    return res.status(401).json({ message: 'Not authorized' })
  }

  if (decoded?.typ !== 'refresh' || !decoded?.id) {
    clearCookie(res)
    return res.status(401).json({ message: 'Not authorized' })
  }

  // Need refresh fields, so explicitly include select:false fields.
  const user = await User.findById(decoded.id).select('+refreshTokenHash +refreshTokenExpiresAt')
  if (!user) {
    clearCookie(res)
    return res.status(401).json({ message: 'Not authorized' })
  }

  if (!user.refreshTokenHash || hashToken(token) !== user.refreshTokenHash) {
    // Token reuse / stolen token / old token
    clearCookie(res)
    return res.status(401).json({ message: 'Not authorized' })
  }

  if (user.refreshTokenExpiresAt && new Date(user.refreshTokenExpiresAt).getTime() < Date.now()) {
    user.refreshTokenHash = ''
    user.refreshTokenExpiresAt = null
    await user.save()
    clearCookie(res)
    return res.status(401).json({ message: 'Session expired' })
  }

  // Rotate refresh token
  const nextRefresh = signRefreshToken(user._id)
  user.refreshTokenHash = hashToken(nextRefresh)
  user.refreshTokenExpiresAt = refreshExpiryDate()
  await user.save()
  setCookie(res, nextRefresh)

  const access = signAccessToken(user._id)
  return res.json({ token: access, user: userPayload(user) })
}))

// Logout: revoke refresh token and clear cookie
router.post('/logout', asyncHandler(async (req, res) => {
  const token = req.cookies?.[COOKIE_NAME]

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      if (decoded?.id) {
        const user = await User.findById(decoded.id).select('+refreshTokenHash +refreshTokenExpiresAt')
        if (user) {
          user.refreshTokenHash = ''
          user.refreshTokenExpiresAt = null
          await user.save()
        }
      }
    } catch {
      // ignore
    }
  }

  clearCookie(res)
  return res.json({ message: 'Logged out' })
}))

module.exports = { router, COOKIE_NAME, setCookie, clearCookie, userPayload }
