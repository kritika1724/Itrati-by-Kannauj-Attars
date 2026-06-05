const { getUploadRuntimeStatus } = require('./uploadRuntime')
const { getRazorpayStatus } = require('./razorpay')

const isProduction = () => process.env.NODE_ENV === 'production'

const env = (key) => String(process.env[key] || '').trim()

const hasConfiguredValue = (key) => env(key).length > 0

const parseOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const looksLocalhost = (value) => /localhost|127\.0\.0\.1/i.test(String(value || ''))

const looksHttps = (value) => /^https:\/\//i.test(String(value || ''))

const validateStartupConfig = () => {
  const errors = []
  const warnings = []
  const uploadRuntime = getUploadRuntimeStatus()
  const razorpay = getRazorpayStatus()
  const origins = parseOrigins(env('CORS_ORIGIN'))
  const oauthEnabled =
    hasConfiguredValue('GOOGLE_CLIENT_ID') ||
    hasConfiguredValue('GITHUB_CLIENT_ID') ||
    hasConfiguredValue('LINKEDIN_CLIENT_ID')

  if (!hasConfiguredValue('MONGO_URI')) {
    errors.push('MONGO_URI is required.')
  }

  if (!hasConfiguredValue('JWT_SECRET')) {
    errors.push('JWT_SECRET is required.')
  } else if (env('JWT_SECRET').length < 32) {
    warnings.push('JWT_SECRET should be at least 32 characters for production-grade security.')
  }

  if (isProduction()) {
    if (!origins.length) {
      errors.push('CORS_ORIGIN must be set in production.')
    } else if (origins.every(looksLocalhost)) {
      errors.push('CORS_ORIGIN still points only to localhost. Set it to your production domain.')
    } else if (origins.some((origin) => !looksHttps(origin))) {
      warnings.push('One or more CORS_ORIGIN values are not HTTPS. Production should use HTTPS origins only.')
    }

    if (!uploadRuntime.ready) {
      errors.push(
        'Production uploads are not ready. Configure Cloudinary or explicitly set ALLOW_LOCAL_UPLOADS=true as a temporary fallback.'
      )
    }

    if (env('ALLOW_LOCAL_UPLOADS').toLowerCase() === 'true') {
      warnings.push('ALLOW_LOCAL_UPLOADS=true is enabled in production. Use this only as a short-term fallback.')
    }

    if (env('COOKIE_SECURE').toLowerCase() === 'false') {
      warnings.push('COOKIE_SECURE=false in production is not recommended.')
    }

    if (oauthEnabled && !hasConfiguredValue('BACKEND_PUBLIC_URL')) {
      warnings.push('OAuth is configured but BACKEND_PUBLIC_URL is missing. Callback URLs may break on some hosts.')
    }

    if (oauthEnabled && !hasConfiguredValue('FRONTEND_ORIGIN') && !origins.length) {
      warnings.push('OAuth is configured but FRONTEND_ORIGIN is not set.')
    }

    if (!razorpay.enabled) {
      warnings.push('Razorpay online payments are disabled because RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are not fully configured.')
    } else if (!razorpay.webhookEnabled) {
      warnings.push('RAZORPAY_WEBHOOK_SECRET is not set. Client-side verification will work, but webhook reconciliation is disabled.')
    }
  }

  if (razorpay.keyIdPresent !== razorpay.keySecretPresent) {
    errors.push('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set together.')
  }

  if (!hasConfiguredValue('ADMIN_EMAIL')) {
    warnings.push('ADMIN_EMAIL is not set. Admin-only bootstrap and access derivation may not work as expected.')
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      nodeEnv: env('NODE_ENV') || 'development',
      corsOrigins: origins,
      uploads: uploadRuntime,
      payments: {
        razorpay,
      },
      oauthEnabled,
    },
  }
}

const printStartupValidationReport = (report) => {
  report.warnings.forEach((warning) => {
    console.warn(`[startup] warning: ${warning}`)
  })

  report.errors.forEach((error) => {
    console.error(`[startup] error: ${error}`)
  })
}

module.exports = {
  validateStartupConfig,
  printStartupValidationReport,
}
