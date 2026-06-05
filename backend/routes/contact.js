const express = require('express')
const ContactMessage = require('../models/ContactMessage')
const { protect, adminOnly } = require('../middleware/auth')
const jwt = require('jsonwebtoken')
const asyncHandler = require('../utils/asyncHandler')
const { contactSubmitLimiter } = require('../utils/rateLimit')

const router = express.Router()
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const tryGetUserIdFromBearer = (req) => {
  try {
    const auth = req.headers.authorization
    if (!auth || !auth.startsWith('Bearer ')) return null
    const token = auth.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!decoded?.id) return null
    if (decoded?.typ && decoded.typ !== 'access') return null
    return decoded.id
  } catch {
    return null
  }
}

// Public: submit contact form
router.post(
  '/',
  contactSubmitLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, message } = req.body || {}
    const normalizedName = String(name || '').trim()
    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedMessage = String(message || '').trim()

    if (!normalizedName || !normalizedEmail || !normalizedMessage) {
      return res.status(400).json({ message: 'Name, email, and message are required' })
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ message: 'Enter a valid email address' })
    }
    if (normalizedName.length > 120) {
      return res.status(400).json({ message: 'Name must be 120 characters or fewer' })
    }
    if (normalizedMessage.length < 10) {
      return res.status(400).json({ message: 'Message must be at least 10 characters' })
    }
    if (normalizedMessage.length > 4000) {
      return res.status(400).json({ message: 'Message must be 4000 characters or fewer' })
    }

    const userId = tryGetUserIdFromBearer(req)

    const doc = await ContactMessage.create({
      user: userId || undefined,
      name: normalizedName,
      email: normalizedEmail,
      message: normalizedMessage,
      ip: String(req.ip || ''),
      userAgent: String(req.headers['user-agent'] || ''),
    })

    return res.status(201).json({ message: 'Received', id: doc._id })
  })
)

// Admin: list messages
router.get(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page || 1))
    const limit = Math.min(100, Math.max(5, Number(req.query.limit || 20)))
    const skip = (page - 1) * limit

    const [total, messages] = await Promise.all([
      ContactMessage.estimatedDocumentCount(),
      ContactMessage.find({})
        .select('user name email message status createdAt')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ])

    res.json({
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
      messages,
    })
  })
)

// Admin: mark read
router.put(
  '/:id/read',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const msg = await ContactMessage.findById(req.params.id)
    if (!msg) return res.status(404).json({ message: 'Message not found' })

    if (msg.status === 'new') {
      msg.status = 'read'
      await msg.save()
    }

    res.json(msg)
  })
)

// Admin: delete
router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const msg = await ContactMessage.findById(req.params.id)
    if (!msg) return res.status(404).json({ message: 'Message not found' })
    await msg.deleteOne()
    res.json({ message: 'Deleted' })
  })
)

module.exports = router
