const express = require('express')
const User = require('../models/User')
const { isAdminEmail } = require('../config/admin')
const { signAccessToken, signRefreshToken, hashToken, refreshExpiryDate } = require('../config/tokens')
const { setCookie, userPayload } = require('./session')
const asyncHandler = require('../utils/asyncHandler')
const { loginLimiter } = require('../utils/rateLimit')

const router = express.Router()

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    if (!isAdminEmail(user.email)) {
      return res.status(403).json({ message: 'Admin only access' })
    }

    const refresh = signRefreshToken(user._id)
    await User.updateOne(
      { _id: user._id },
      { $set: { refreshTokenHash: hashToken(refresh), refreshTokenExpiresAt: refreshExpiryDate() } }
    )
    setCookie(res, refresh)

    const access = signAccessToken(user._id)
    res.json({
      token: access,
      user: { ...userPayload(user), isAdmin: true, role: 'admin' },
    })
  })
)

module.exports = router
