const express = require('express')
const crypto = require('crypto')
const mongoose = require('mongoose')
const Order = require('../models/Order')
const { paymentActionLimiter } = require('../utils/rateLimit')
const { getRazorpayClient, mustGetRazorpayConfig, mustGetRazorpayWebhookSecret } = require('../config/razorpay')
const { optionalProtect, adminOnly } = require('../middleware/auth')
const { reserveOrderStock, restoreOrderStock, stockWasReserved } = require('../utils/orderStock')

const router = express.Router()
const ORDER_PAYMENT_SELECT =
  'publicOrderId user orderItems shippingAddress.fullName shippingAddress.email shippingAddress.phone shippingAddress.whatsapp shippingAddress.addressLine1 shippingAddress.addressLine2 shippingAddress.city shippingAddress.state shippingAddress.postalCode shippingAddress.country paymentMethod totalPrice isPaid status paymentResult paidAt stockReserved'
const MINIMUM_RAZORPAY_AMOUNT_PAISE = 100

const normalizePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.length > 10 ? digits.slice(-10) : digits
}

const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

const canAccessPaymentOrder = (req, order) => {
  if (req.user?.isAdmin === true) return true
  if (req.user?._id && order.user && String(req.user._id) === String(order.user._id || order.user)) {
    return true
  }

  if (order.user) return false

  const requestEmail = normalizeEmail(req.body?.email)
  const orderEmail = normalizeEmail(order.shippingAddress?.email)
  if (requestEmail && orderEmail && requestEmail === orderEmail) {
    return true
  }

  const requestContacts = [req.body?.phone, req.body?.whatsapp, req.body?.contact]
    .map(normalizePhone)
    .filter(Boolean)
  const orderContacts = [order.shippingAddress?.phone, order.shippingAddress?.whatsapp]
    .map(normalizePhone)
    .filter(Boolean)

  return requestContacts.some((value) => orderContacts.includes(value))
}

const buildPaymentResult = ({
  order,
  status,
  razorpayOrderId = '',
  razorpayPaymentId = '',
  razorpaySignature = '',
  paymentEntity = {},
  webhookEventId = '',
}) => {
  const amount = Number(paymentEntity?.amount)

  return {
    ...(order.paymentResult || {}),
    provider: 'razorpay',
    id: razorpayPaymentId || order.paymentResult?.id || '',
    status: status || paymentEntity?.status || order.paymentResult?.status || '',
    email: paymentEntity?.email || order.shippingAddress?.email || order.user?.email || order.paymentResult?.email || '',
    method: paymentEntity?.method || order.paymentResult?.method || '',
    razorpayOrderId: razorpayOrderId || order.paymentResult?.razorpayOrderId || '',
    razorpayPaymentId: razorpayPaymentId || order.paymentResult?.razorpayPaymentId || '',
    razorpaySignature: razorpaySignature || order.paymentResult?.razorpaySignature || '',
    webhookEventId: webhookEventId || order.paymentResult?.webhookEventId || '',
    amount: Number.isFinite(amount) ? amount : order.paymentResult?.amount,
    currency: paymentEntity?.currency || order.paymentResult?.currency || 'INR',
    errorCode: paymentEntity?.error_code || '',
    errorDescription: paymentEntity?.error_description || '',
  }
}

const getOrderOr404 = async (orderId) => {
  const order = await Order.findById(orderId)
    .select(ORDER_PAYMENT_SELECT)
    .populate('user', 'email')
  if (!order) {
    const err = new Error('Order not found')
    err.statusCode = 404
    throw err
  }

  return order
}

const findOrderForWebhook = async (paymentEntity = {}, orderEntity = {}) => {
  const razorpayOrderId = String(orderEntity?.id || paymentEntity?.order_id || '').trim()
  const appOrderId = String(paymentEntity?.notes?.app_order_id || orderEntity?.receipt || '').trim()

  let order = null

  if (razorpayOrderId) {
    order = await Order.findOne({ 'paymentResult.razorpayOrderId': razorpayOrderId })
      .select(ORDER_PAYMENT_SELECT)
      .populate('user', 'email')
  }

  if (!order && appOrderId && mongoose.isValidObjectId(appOrderId)) {
    order = await Order.findById(appOrderId)
      .select(ORDER_PAYMENT_SELECT)
      .populate('user', 'email')
  }

  return order
}

const applyPaidPaymentState = (order, { razorpayOrderId, razorpayPaymentId, razorpaySignature = '', paymentEntity = {}, webhookEventId = '' }) => {
  order.isPaid = true
  order.paidAt = order.paidAt || new Date()
  if (['pending', 'payment_pending'].includes(String(order.status || '').toLowerCase())) {
    order.status = 'confirmed'
  }
  order.cancelledAt = null
  order.paymentResult = buildPaymentResult({
    order,
    status: 'paid',
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    paymentEntity,
    webhookEventId,
  })
}

const assertPayableOrder = (order) => {
  if (String(order.status || '').toLowerCase() === 'cancelled') {
    const err = new Error('Order is cancelled')
    err.statusCode = 400
    throw err
  }
}

const markOrderPaid = async (order, paymentData) => {
  const session = await mongoose.startSession()

  try {
    let updatedOrder
    await session.withTransaction(async () => {
      const currentOrder = await Order.findById(order._id)
        .select(ORDER_PAYMENT_SELECT)
        .populate('user', 'email')
        .session(session)

      if (!currentOrder) {
        const err = new Error('Order not found')
        err.statusCode = 404
        throw err
      }

      const existingPaymentId = String(currentOrder.paymentResult?.razorpayPaymentId || currentOrder.paymentResult?.id || '').trim()
      if (currentOrder.isPaid) {
        if (existingPaymentId && paymentData.razorpayPaymentId && existingPaymentId !== paymentData.razorpayPaymentId) {
          updatedOrder = currentOrder
          return
        }

        updatedOrder = currentOrder
        return
      }

      assertPayableOrder(currentOrder)

      if (!stockWasReserved(currentOrder)) {
        await reserveOrderStock(currentOrder, session)
      }

      currentOrder.stockReserved = true
      applyPaidPaymentState(currentOrder, paymentData)
      updatedOrder = await currentOrder.save({ session })
    })

    return updatedOrder
  } finally {
    await session.endSession()
  }
}

const updatePaymentAttempt = async (order, { status, razorpayOrderId = '', razorpayPaymentId = '', paymentEntity = {}, webhookEventId = '' }) => {
  if (order.isPaid && status !== 'paid') {
    return order
  }

  if (status === 'failed') {
    const session = await mongoose.startSession()

    try {
      let updatedOrder
      await session.withTransaction(async () => {
        const currentOrder = await Order.findById(order._id)
          .select(ORDER_PAYMENT_SELECT)
          .populate('user', 'email')
          .session(session)

        if (!currentOrder) {
          const err = new Error('Order not found')
          err.statusCode = 404
          throw err
        }

        if (currentOrder.isPaid) {
          updatedOrder = currentOrder
          return
        }

        if (stockWasReserved(currentOrder)) {
          await restoreOrderStock(currentOrder, session)
          currentOrder.stockReserved = false
        }

        if (String(currentOrder.status || '').toLowerCase() !== 'cancelled') {
          currentOrder.status = 'payment_pending'
          currentOrder.cancelledAt = null
        }

        currentOrder.paymentResult = buildPaymentResult({
          order: currentOrder,
          status,
          razorpayOrderId,
          razorpayPaymentId,
          paymentEntity,
          webhookEventId,
        })

        updatedOrder = await currentOrder.save({ session })
      })

      return updatedOrder
    } finally {
      await session.endSession()
    }
  }

  order.paymentResult = buildPaymentResult({
    order,
    status,
    razorpayOrderId,
    razorpayPaymentId,
    paymentEntity,
    webhookEventId,
  })

  return order.save()
}

const ensureOrderStockReserved = async (order) => {
  if (stockWasReserved(order)) return order

  const session = await mongoose.startSession()

  try {
    let updatedOrder
    await session.withTransaction(async () => {
      const currentOrder = await Order.findById(order._id)
        .select(ORDER_PAYMENT_SELECT)
        .populate('user', 'email')
        .session(session)

      if (!currentOrder) {
        const err = new Error('Order not found')
        err.statusCode = 404
        throw err
      }

      if (currentOrder.isPaid) {
        const err = new Error('Order is already paid')
        err.statusCode = 400
        throw err
      }

      if (String(currentOrder.status || '').toLowerCase() === 'cancelled') {
        const err = new Error('Order is cancelled')
        err.statusCode = 400
        throw err
      }

      if (!stockWasReserved(currentOrder)) {
        await reserveOrderStock(currentOrder, session)
        currentOrder.stockReserved = true
        updatedOrder = await currentOrder.save({ session })
        return
      }

      updatedOrder = currentOrder
    })

    return updatedOrder
  } finally {
    await session.endSession()
  }
}

router.post('/razorpay/webhook', async (req, res) => {
  try {
    const webhookSecret = mustGetRazorpayWebhookSecret()
    const signature = String(req.get('x-razorpay-signature') || '').trim()
    const rawBody = typeof req.rawBody === 'string' ? req.rawBody : ''

    if (!signature || !rawBody) {
      return res.status(400).json({ message: 'Missing Razorpay webhook signature or payload' })
    }

    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex')
    if (expected !== signature) {
      return res.status(400).json({ message: 'Invalid Razorpay webhook signature' })
    }

    const event = String(req.body?.event || '').trim()
    const webhookEventId = String(req.get('x-razorpay-event-id') || '').trim()
    const paymentEntity = req.body?.payload?.payment?.entity || {}
    const orderEntity = req.body?.payload?.order?.entity || {}
    const razorpayOrderId = String(orderEntity?.id || paymentEntity?.order_id || '').trim()
    const razorpayPaymentId = String(paymentEntity?.id || '').trim()

    const order = await findOrderForWebhook(paymentEntity, orderEntity)
    if (!order || (order.paymentMethod || '').toUpperCase() !== 'RAZORPAY') {
      return res.status(202).json({ received: true, ignored: true })
    }

    if (event === 'payment.authorized') {
      await updatePaymentAttempt(order, {
        status: 'authorized',
        razorpayOrderId,
        razorpayPaymentId,
        paymentEntity,
        webhookEventId,
      })
    } else if (event === 'payment.failed') {
      await updatePaymentAttempt(order, {
        status: 'failed',
        razorpayOrderId,
        razorpayPaymentId,
        paymentEntity,
        webhookEventId,
      })
    } else if (event === 'payment.captured' || event === 'order.paid') {
      await markOrderPaid(order, {
        razorpayOrderId,
        razorpayPaymentId,
        paymentEntity,
        webhookEventId,
      })
    }

    return res.json({ received: true })
  } catch (e) {
    return res.status(e.statusCode || 500).json({ message: e.message || 'Server error' })
  }
})

// Create (or re-create) a Razorpay order for a given app Order.
router.post('/razorpay/order', optionalProtect, paymentActionLimiter, async (req, res) => {
  try {
    const { keyId } = mustGetRazorpayConfig()
    const razorpay = getRazorpayClient()

    const orderId = String(req.body?.orderId || '').trim()
    if (!orderId) return res.status(400).json({ message: 'orderId is required' })

    let order = await getOrderOr404(orderId)
    if (!canAccessPaymentOrder(req, order)) {
      return res.status(403).json({ message: 'Not authorized to start payment for this order' })
    }

    if ((order.paymentMethod || '').toUpperCase() !== 'RAZORPAY') {
      return res.status(400).json({ message: 'Order payment method is not Razorpay' })
    }

    if (String(order.status || '').toLowerCase() === 'cancelled') {
      return res.status(400).json({ message: 'Order is cancelled' })
    }

    if (order.isPaid) {
      return res.status(400).json({ message: 'Order is already paid' })
    }

    order = await ensureOrderStockReserved(order)

    const amountPaise = Math.round(Number(order.totalPrice || 0) * 100)
    if (!Number.isFinite(amountPaise) || amountPaise < MINIMUM_RAZORPAY_AMOUNT_PAISE) {
      return res.status(400).json({ message: 'Razorpay amount must be at least 100 paise' })
    }

    const payload = {
      amount: amountPaise,
      currency: 'INR',
      receipt: order._id.toString(),
      notes: {
        app_order_id: order._id.toString(),
        public_order_id: order.publicOrderId || '',
        email: order.shippingAddress?.email || order.user?.email || '',
      },
    }
    const data = await razorpay.orders.create(payload)

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
    const statusCode =
      e?.statusCode ||
      e?.status ||
      (e?.error?.code === 'BAD_REQUEST_ERROR' ? 400 : null) ||
      (e?.error?.code === 'AUTHENTICATION_ERROR' ? 401 : null) ||
      500
    const message =
      e?.error?.description ||
      e?.error?.reason ||
      e?.message ||
      'Failed to create Razorpay order'
    return res.status(statusCode).json({ message })
  }
})

// Verify payment signature and mark paid.
router.post('/razorpay/verify', optionalProtect, paymentActionLimiter, async (req, res) => {
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
    if (!canAccessPaymentOrder(req, order)) {
      return res.status(403).json({ message: 'Not authorized to verify payment for this order' })
    }

    if ((order.paymentMethod || '').toUpperCase() !== 'RAZORPAY') {
      return res.status(400).json({ message: 'Order payment method is not Razorpay' })
    }

    const storedOrderId = String(order.paymentResult?.razorpayOrderId || '').trim()
    if (storedOrderId && storedOrderId !== razorpayOrderId) {
      return res.status(400).json({ message: 'Razorpay order mismatch' })
    }
    const orderReference = storedOrderId || razorpayOrderId

    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderReference}|${razorpayPaymentId}`)
      .digest('hex')

    if (expected !== razorpaySignature) {
      return res.status(400).json({ message: 'Invalid payment signature' })
    }

    const updated = await markOrderPaid(order, {
      razorpayOrderId: orderReference,
      razorpayPaymentId,
      razorpaySignature,
    })
    return res.json(updated)
  } catch (e) {
    return res.status(e.statusCode || 500).json({ message: e.message || 'Server error' })
  }
})

module.exports = router
