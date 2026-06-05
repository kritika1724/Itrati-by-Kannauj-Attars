const Razorpay = require('razorpay')

const env = (key) => String(process.env[key] || '').trim()

const getRazorpayStatus = () => {
  const keyId = env('RAZORPAY_KEY_ID')
  const keySecret = env('RAZORPAY_KEY_SECRET')
  const webhookSecret = env('RAZORPAY_WEBHOOK_SECRET')

  return {
    enabled: Boolean(keyId && keySecret),
    keyIdPresent: Boolean(keyId),
    keySecretPresent: Boolean(keySecret),
    webhookEnabled: Boolean(webhookSecret),
  }
}

const mustGetRazorpayConfig = () => {
  const keyId = env('RAZORPAY_KEY_ID')
  const keySecret = env('RAZORPAY_KEY_SECRET')

  if (!keyId || !keySecret) {
    const err = new Error('Razorpay is not configured (RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET)')
    err.statusCode = 500
    throw err
  }

  return {
    keyId,
    keySecret,
  }
}

const getRazorpayClient = () => {
  const { keyId, keySecret } = mustGetRazorpayConfig()

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })
}

const mustGetRazorpayWebhookSecret = () => {
  const webhookSecret = env('RAZORPAY_WEBHOOK_SECRET')

  if (!webhookSecret) {
    const err = new Error('Razorpay webhook is not configured (RAZORPAY_WEBHOOK_SECRET)')
    err.statusCode = 503
    throw err
  }

  return webhookSecret
}

module.exports = {
  getRazorpayClient,
  getRazorpayStatus,
  mustGetRazorpayConfig,
  mustGetRazorpayWebhookSecret,
}
