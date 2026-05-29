const express = require('express')
const crypto = require('crypto')
const Order = require('../models/Order')
const { paymentActionLimiter } = require('../utils/rateLimit')

const router = express.Router()

const mustGetRazorpayConfig = () => {
  const keyId = String(process.env.RAZORPAY_KEY_ID || '').trim()
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim()
  if (!keyId || !keySecret) {
    const err = new Error('Razorpay is not configured (RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET)')
    err.statusCode = 500
    throw err
  }
  return { keyId, keySecret }
}

const getOrderOr404 = async (orderId) => {
  const order = await Order.findById(orderId)
    .select('publicOrderId user shippingAddress.email paymentMethod totalPrice isPaid status paymentResult paidAt')
    .populate('user', 'email')
  if (!order) {
    const err = new Error('Order not found')
    err.statusCode = 404
    throw err
  }

  return order
}

// Create (or re-create) a Razorpay order for a given app Order.
router.post('/razorpay/order', paymentActionLimiter, async (req, res) => {
  try {
    const { keyId, keySecret } = mustGetRazorpayConfig()

    const orderId = String(req.body?.orderId || '').trim()
    if (!orderId) return res.status(400).json({ message: 'orderId is required' })

    const order = await getOrderOr404(orderId)

    if ((order.paymentMethod || '').toUpperCase() !== 'RAZORPAY') {
      return res.status(400).json({ message: 'Order payment method is not Razorpay' })
    }

    if (order.isPaid) {
      return res.status(400).json({ message: 'Order is already paid' })
    }

    const amountPaise = Math.round(Number(order.totalPrice || 0) * 100)
    if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
      return res.status(400).json({ message: 'Invalid order amount' })
    }

    const payload = {
      amount: amountPaise,
      currency: 'INR',
      receipt: order._id.toString(),
      notes: {
        app_order_id: order._id.toString(),
        email: order.shippingAddress?.email || order.user?.email || '',
      },
    }

    const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const r = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await r.json().catch(() => ({}))
    if (!r.ok) {
      const msg = data?.error?.description || data?.error?.code || 'Failed to create Razorpay order'
      return res.status(400).json({ message: msg })
    }

    order.paymentResult = {
      ...(order.paymentResult || {}),
      provider: 'razorpay',
      status: data.status || 'created',
      razorpayOrderId: data.id,
      amount: data.amount,
      currency: data.currency,
      email: order.shippingAddress?.email || order.user?.email || '',
    }

    await order.save()

    return res.json({
      keyId,
      razorpayOrderId: data.id,
      amount: data.amount,
      currency: data.currency,
      orderId: order._id.toString(),
    })
  } catch (e) {
    return res.status(e.statusCode || 500).json({ message: e.message || 'Server error' })
  }
})

// Verify payment signature and mark paid.
router.post('/razorpay/verify', paymentActionLimiter, async (req, res) => {
  try {
    const { keySecret } = mustGetRazorpayConfig()

    const orderId = String(req.body?.orderId || '').trim()
    const razorpayOrderId = String(req.body?.razorpay_order_id || '').trim()
    const razorpayPaymentId = String(req.body?.razorpay_payment_id || '').trim()
    const razorpaySignature = String(req.body?.razorpay_signature || '').trim()

    if (!orderId) return res.status(400).json({ message: 'orderId is required' })
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: 'Missing Razorpay verification fields' })
    }

    const order = await getOrderOr404(orderId)

    if ((order.paymentMethod || '').toUpperCase() !== 'RAZORPAY') {
      return res.status(400).json({ message: 'Order payment method is not Razorpay' })
    }

    const storedOrderId = order.paymentResult?.razorpayOrderId
    if (storedOrderId && storedOrderId !== razorpayOrderId) {
      return res.status(400).json({ message: 'Razorpay order mismatch' })
    }

    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (expected !== razorpaySignature) {
      return res.status(400).json({ message: 'Invalid payment signature' })
    }

    order.isPaid = true
    order.paidAt = new Date()
    if (order.status === 'pending') order.status = 'confirmed'

    order.paymentResult = {
      ...(order.paymentResult || {}),
      provider: 'razorpay',
      id: razorpayPaymentId,
      status: 'paid',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      email: order.shippingAddress?.email || order.user?.email || '',
    }

    const updated = await order.save()
    return res.json(updated)
  } catch (e) {
    return res.status(e.statusCode || 500).json({ message: e.message || 'Server error' })
  }
})

module.exports = router
