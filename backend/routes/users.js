const express = require('express')
const User = require('../models/User')
const { protect } = require('../middleware/auth')
const { isAdminEmail } = require('../config/admin')
const { signAccessToken, signRefreshToken, hashToken, refreshExpiryDate } = require('../config/tokens')
const { setCookie, userPayload } = require('./session')
const asyncHandler = require('../utils/asyncHandler')

const router = express.Router()

router.post('/register', asyncHandler(async (req, res) => {
    return res.status(403).json({
      message: 'New account registration is currently closed. Please contact Itrati by Kannauj Attars directly.',
    })
}))

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const normalizedEmail = email.toLowerCase()
    const user = await User.findOne({ email: normalizedEmail })
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' })
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
      user: userPayload(user),
    })
  })
)

router.get('/me', protect, asyncHandler(async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    isAdmin: isAdminEmail(req.user.email),
    role: isAdminEmail(req.user.email) ? 'admin' : 'user',
  })
}))

module.exports = router
