const rateLimit = require('express-rate-limit')

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

const envLimit = (primaryKey, legacyKey, fallback) =>
  toPositiveInt(process.env[primaryKey] || process.env[legacyKey], fallback)

const buildJsonLimiter = ({
  windowMs,
  limit,
  message,
  skipSuccessfulRequests = false,
}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res, _next, options) => {
      const resetTime = req.rateLimit?.resetTime ? new Date(req.rateLimit.resetTime).getTime() : Date.now() + windowMs
      const retryAfterSeconds = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000))
      res.status(options.statusCode || 429).json({
        message,
        retryAfterSeconds,
      })
    },
  })

const userLoginLimiter = buildJsonLimiter({
  windowMs: 15 * 60 * 1000,
  limit: envLimit('RATE_LIMIT_USER_LOGIN_ATTEMPTS', 'RATE_LIMIT_LOGIN_ATTEMPTS', 8),
  message: 'Too many login attempts. Please wait a few minutes and try again.',
  skipSuccessfulRequests: true,
})

const adminLoginLimiter = buildJsonLimiter({
  windowMs: 15 * 60 * 1000,
  limit: envLimit('RATE_LIMIT_ADMIN_LOGIN_ATTEMPTS', 'RATE_LIMIT_LOGIN_ATTEMPTS', 5),
  message: 'Too many admin login attempts. Please wait a few minutes and try again.',
  skipSuccessfulRequests: true,
})

const registerLimiter = buildJsonLimiter({
  windowMs: 60 * 60 * 1000,
  limit: envLimit('RATE_LIMIT_REGISTER_ATTEMPTS', 'RATE_LIMIT_LOGIN_ATTEMPTS', 4),
  message: 'Too many registration attempts. Please try again later.',
})

const sessionRefreshLimiter = buildJsonLimiter({
  windowMs: 15 * 60 * 1000,
  limit: toPositiveInt(process.env.RATE_LIMIT_SESSION_REFRESH, 45),
  message: 'Too many session refresh attempts. Please wait a moment and try again.',
})

const contactSubmitLimiter = buildJsonLimiter({
  windowMs: 60 * 60 * 1000,
  limit: toPositiveInt(process.env.RATE_LIMIT_CONTACT_SUBMISSIONS, 4),
  message: 'Too many contact submissions. Please try again later.',
})

const uploadWriteLimiter = buildJsonLimiter({
  windowMs: 15 * 60 * 1000,
  limit: toPositiveInt(process.env.RATE_LIMIT_UPLOADS, 12),
  message: 'Too many uploads right now. Please wait and try again.',
})

const orderCreateLimiter = buildJsonLimiter({
  windowMs: 15 * 60 * 1000,
  limit: toPositiveInt(process.env.RATE_LIMIT_ORDER_CREATES, 8),
  message: 'Too many checkout attempts. Please wait a little and try again.',
})

const orderTrackLimiter = buildJsonLimiter({
  windowMs: 15 * 60 * 1000,
  limit: toPositiveInt(process.env.RATE_LIMIT_ORDER_TRACKS, 20),
  message: 'Too many order tracking requests. Please wait a little and try again.',
})

const orderMutationLimiter = buildJsonLimiter({
  windowMs: 15 * 60 * 1000,
  limit: toPositiveInt(process.env.RATE_LIMIT_ORDER_MUTATIONS, 10),
  message: 'Too many order update requests. Please wait a little and try again.',
})

const paymentActionLimiter = buildJsonLimiter({
  windowMs: 15 * 60 * 1000,
  limit: toPositiveInt(process.env.RATE_LIMIT_PAYMENT_ACTIONS, 12),
  message: 'Too many payment requests. Please wait a little and try again.',
})

module.exports = {
  userLoginLimiter,
  adminLoginLimiter,
  registerLimiter,
  sessionRefreshLimiter,
  contactSubmitLimiter,
  uploadWriteLimiter,
  orderCreateLimiter,
  orderTrackLimiter,
  orderMutationLimiter,
  paymentActionLimiter,
}
