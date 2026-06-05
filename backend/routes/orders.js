const express = require('express')
const mongoose = require('mongoose')
const Order = require('../models/Order')
const Product = require('../models/Product')
const { protect, optionalProtect, adminOnly } = require('../middleware/auth')
const asyncHandler = require('../utils/asyncHandler')
const { orderCreateLimiter, orderTrackLimiter, orderMutationLimiter } = require('../utils/rateLimit')
const { getWelcomeDiscount } = require('../config/cartOffers')

const router = express.Router()
const TRACK_ORDER_SELECT =
  'publicOrderId status createdAt updatedAt paymentMethod isPaid paidAt totalPrice itemsPrice shippingPrice taxPrice discountCode discountPercent discountAmount orderItems shippingAddress.fullName shippingAddress.phone shippingAddress.whatsapp shippingAddress.email shippingAddress.city shippingAddress.state shippingAddress.postalCode shippingAddress.country'

const packToGrams = (label) => {
  const str = String(label || '').toLowerCase().replace(/,/g, '').trim()
  const kg = str.match(/(\d+(?:\.\d+)?)\s*kg\b/)
  if (kg) return Number(kg[1]) * 1000
  const gm = str.match(/(\d+(?:\.\d+)?)\s*(gm|g)\b/)
  if (gm) return Number(gm[1])
  return null
}

const isBulkPack = (label) => {
  const grams = packToGrams(label)
  return grams !== null && Number.isFinite(grams) && grams >= 1000
}

const normalizePhone = (value) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.length > 10 ? digits.slice(-10) : digits
}

const canAccessOrder = (reqUser, orderUserId) => {
  if (!reqUser) return false
  if (reqUser.isAdmin === true) return true
  if (!orderUserId) return false
  return String(orderUserId) === String(reqUser._id)
}

const canCustomerCancel = (status) => String(status || '').toLowerCase() === 'pending'

const findTrackableOrder = async (publicOrderId, { lean = true } = {}) => {
  const findBy = async (finder) => {
    const query = finder.select(TRACK_ORDER_SELECT)
    return lean ? query.lean() : query.exec()
  }

  let order = await findBy(Order.findOne({ publicOrderId }))
  if (!order && mongoose.isValidObjectId(publicOrderId)) {
    order = await findBy(Order.findById(publicOrderId))
  }
  return order
}

const contactMatchesOrder = (order, contactValue) => {
  const allowedContacts = [order?.shippingAddress?.whatsapp, order?.shippingAddress?.phone]
    .map(normalizePhone)
    .filter(Boolean)
  return allowedContacts.includes(contactValue)
}

const normalizeShippingAddress = (value = {}) => ({
  fullName: String(value.fullName || '').trim(),
  email: String(value.email || '').trim().toLowerCase(),
  phone: String(value.phone || '').trim(),
  whatsapp: String(value.whatsapp || '').trim(),
  addressLine1: String(value.addressLine1 || '').trim(),
  addressLine2: String(value.addressLine2 || '').trim(),
  city: String(value.city || '').trim(),
  state: String(value.state || '').trim(),
  postalCode: String(value.postalCode || '').trim(),
  country: String(value.country || 'India').trim(),
})

const getMissingShippingFields = (value = {}) =>
  [
    ['fullName', 'full name'],
    ['email', 'email'],
    ['phone', 'phone'],
    ['whatsapp', 'WhatsApp number'],
    ['addressLine1', 'address line 1'],
    ['city', 'city'],
    ['state', 'state'],
    ['postalCode', 'postal code'],
    ['country', 'country'],
  ].filter(([key]) => !value[key]).map(([, label]) => label)

const getEffectivePackPrice = (pack) => {
  const regularPrice = Number(pack?.price)
  const salePrice = Number(pack?.salePrice)
  if (Number.isFinite(salePrice) && salePrice > 0 && Number.isFinite(regularPrice) && salePrice < regularPrice) {
    return salePrice
  }
  return regularPrice
}

const getOrderStockAdjustments = (orderItems = []) => {
  const totals = new Map()
  orderItems.forEach((item) => {
    const productId = String(item?.product || '')
    if (!productId) return
    const qty = Math.max(1, Number(item?.qty || 1))
    totals.set(productId, (totals.get(productId) || 0) + qty)
  })
  return totals
}

const restoreOrderStock = async (order, session = null) => {
  const adjustments = getOrderStockAdjustments(order?.orderItems || [])
  if (!adjustments.size) return

  const ops = [...adjustments.entries()].map(([productId, qty]) => ({
    updateOne: {
      filter: { _id: productId },
      update: { $inc: { stock: qty } },
    },
  }))

  const options = {}
  if (session) options.session = session
  await Product.bulkWrite(ops, options)
}

const reserveOrderStock = async (order, session = null) => {
  const adjustments = getOrderStockAdjustments(order?.orderItems || [])
  if (!adjustments.size) return

  const query = Product.find({ _id: { $in: [...adjustments.keys()] } }).select('name stock')
  if (session) query.session(session)
  const inventoryProducts = await query
  const inventoryMap = new Map(inventoryProducts.map((product) => [String(product._id), product]))

  for (const [productId, qtyNeeded] of adjustments.entries()) {
    const product = inventoryMap.get(productId)
    if (!product) {
      throw new Error('Invalid product in order')
    }

    const availableStock = Math.max(0, Number(product.stock || 0))
    if (availableStock < qtyNeeded) {
      throw new Error(`${product.name} has only ${availableStock} item(s) left in stock`)
    }
  }

  const ops = inventoryProducts
    .map((product) => {
      const qtyNeeded = adjustments.get(String(product._id)) || 0
      if (!qtyNeeded) return null
      return {
        updateOne: {
          filter: { _id: product._id },
          update: { $inc: { stock: -qtyNeeded } },
        },
      }
    })
    .filter(Boolean)

  if (!ops.length) return

  const options = {}
  if (session) options.session = session
  await Product.bulkWrite(ops, options)
}

// Create order
router.post(
  '/',
  orderCreateLimiter,
  optionalProtect,
  asyncHandler(async (req, res) => {
    if (req.user?.isAdmin === true) {
      return res.status(403).json({ message: 'Admins cannot place orders' })
    }

    const { orderItems, shippingAddress, paymentMethod, couponCode } = req.body
    const normalizedShippingAddress = normalizeShippingAddress(shippingAddress)

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res.status(400).json({ message: 'Order items are required' })
    }

    const missingShippingFields = getMissingShippingFields(normalizedShippingAddress)
    if (missingShippingFields.length > 0) {
      return res.status(400).json({
        message: `Shipping details are incomplete: ${missingShippingFields.join(', ')}`,
      })
    }

    const productIds = [...new Set(orderItems.map((item) => String(item.product || '')).filter(Boolean))]
    const products = await Product.find({ _id: { $in: productIds } })
      .select('name price packs images sample stock')
      .lean()

    const productMap = new Map(products.map((product) => [String(product._id), product]))

    let normalizedItems
    try {
      normalizedItems = orderItems.map((item) => {
        const product = productMap.get(String(item.product))
        if (!product) {
          throw new Error('Invalid product in order')
        }

        const requestedPackLabel = String(item.packLabel || '').trim()
        const isSample = item?.isSample === true
        const pack =
          requestedPackLabel && Array.isArray(product.packs)
            ? product.packs.find((p) => (p.label || '').trim() === requestedPackLabel)
            : null
        const sample = product?.sample || {}

        if (isSample) {
          const sampleLabel = String(sample.label || '').trim()
          const samplePrice = Number(sample.price)
          if (sample.enabled !== true || !sampleLabel || Number.isNaN(samplePrice)) {
            throw new Error(`Sample is not available for product: ${product.name}`)
          }

          return {
            product: product._id,
            name: product.name,
            qty: Math.max(1, Number(item.qty || 1)),
            price: samplePrice,
            image: product.images?.[0] || '',
            sample: true,
            pack: { label: sampleLabel },
          }
        }

        if (Array.isArray(product.packs) && product.packs.length > 0) {
          if (!requestedPackLabel) {
            throw new Error(`Pack size is required for product: ${product.name}`)
          }
          if (!pack) {
            throw new Error(`Invalid pack size for product: ${product.name}`)
          }
        }

        const selectedLabel = pack ? pack.label : requestedPackLabel || ''
        if (selectedLabel && isBulkPack(selectedLabel)) {
          throw new Error(`Bulk pack size selected for ${product.name}. Please contact us for bulk/industrial orders.`)
        }

        const qty = Math.max(1, Number(item.qty || 1))

        return {
          product: product._id,
          name: product.name,
          qty,
          price: pack ? getEffectivePackPrice(pack) : product.price,
          image: product.images?.[0] || '',
          sample: false,
          pack: { label: pack ? pack.label : requestedPackLabel || '' },
        }
      })
    } catch (e) {
      return res.status(400).json({ message: e.message || 'Invalid order items' })
    }

    const itemsPrice = normalizedItems.reduce((sum, item) => sum + item.qty * item.price, 0)
    const shippingPrice = 0
    const taxPrice = 0
    const subtotal = itemsPrice + shippingPrice + taxPrice
    const { discountCode, discountPercent, discountAmount } = getWelcomeDiscount(couponCode, subtotal)
    const totalPrice = Math.max(0, subtotal - discountAmount)

    const method = String(paymentMethod || 'COD').trim().toUpperCase()
    const COD_LIMIT = Number(process.env.COD_LIMIT || 2000)
    if (method === 'COD' && Number.isFinite(COD_LIMIT) && totalPrice > COD_LIMIT) {
      return res.status(400).json({
        message: `Cash on Delivery is not available for orders above ₹${COD_LIMIT}. Please choose online payment.`,
      })
    }

    const session = await mongoose.startSession()

    let savedOrder
    try {
      await session.withTransaction(async () => {
        await reserveOrderStock({ orderItems: normalizedItems }, session)

        savedOrder = await Order.create(
          [
            {
              user: req.user?._id || null,
              orderItems: normalizedItems,
              shippingAddress: normalizedShippingAddress,
              paymentMethod: method || 'COD',
              itemsPrice,
              shippingPrice,
              taxPrice,
              discountCode,
              discountPercent,
              discountAmount,
              totalPrice,
              status: 'pending',
            },
          ],
          { session }
        )
      })
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Unable to place order' })
    } finally {
      await session.endSession()
    }

    res.status(201).json(savedOrder?.[0] || savedOrder)
  })
)

// Public: track order using short tracking ID + phone/WhatsApp
router.get(
  '/track/:publicOrderId',
  orderTrackLimiter,
  asyncHandler(async (req, res) => {
    const publicOrderId = String(req.params.publicOrderId || '').trim().toUpperCase()
    const contactValue = normalizePhone(req.query.whatsapp || req.query.phone || '')

    if (!publicOrderId) {
      return res.status(400).json({ message: 'Order id is required' })
    }

    if (!contactValue) {
      return res.status(400).json({ message: 'WhatsApp or phone number is required' })
    }

    const order = await findTrackableOrder(publicOrderId)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (!contactMatchesOrder(order, contactValue)) {
      return res.status(404).json({ message: 'Order not found for the provided details' })
    }

    res.json(order)
  })
)

// Public: cancel order from track-order flow before admin confirmation
router.put(
  '/track/:publicOrderId/cancel',
  orderMutationLimiter,
  asyncHandler(async (req, res) => {
    const publicOrderId = String(req.params.publicOrderId || '').trim().toUpperCase()
    const contactValue = normalizePhone(req.body?.whatsapp || req.body?.phone || req.query.whatsapp || req.query.phone || '')

    if (!publicOrderId) {
      return res.status(400).json({ message: 'Order id is required' })
    }

    if (!contactValue) {
      return res.status(400).json({ message: 'WhatsApp or phone number is required' })
    }

    const order = await findTrackableOrder(publicOrderId, { lean: false })
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (!contactMatchesOrder(order, contactValue)) {
      return res.status(404).json({ message: 'Order not found for the provided details' })
    }

    if (order.status === 'cancelled') {
      const current = await findTrackableOrder(publicOrderId)
      return res.json(current)
    }

    if (!canCustomerCancel(order.status)) {
      return res.status(400).json({ message: 'Order can only be cancelled before confirmation' })
    }

    await restoreOrderStock(order)
    order.status = 'cancelled'
    order.cancelledAt = new Date()
    order.isDelivered = false
    order.deliveredAt = null

    await order.save()

    const updated = await findTrackableOrder(order.publicOrderId || publicOrderId)
    return res.json(updated)
  })
)

// Get my orders
router.get(
  '/mine',
  protect,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id })
      .select('_id publicOrderId totalPrice createdAt status')
      .sort({ createdAt: -1 })
      .lean()
    res.json(orders)
  })
)

// Get all orders (admin)
router.get(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({})
      .select(
        '_id publicOrderId user shippingAddress.fullName shippingAddress.email shippingAddress.whatsapp totalPrice paymentMethod status createdAt'
      )
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean()
    res.json(orders)
  })
)

// Get order by id
router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email').lean()
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (!canAccessOrder(req.user, order.user?._id || order.user)) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    res.json(order)
  })
)

// Mark order as paid
router.put(
  '/:id/pay',
  orderMutationLimiter,
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (!canAccessOrder(req.user, order.user)) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    order.isPaid = true
    order.paidAt = new Date()
    order.paymentResult = {
      id: req.body?.id || 'manual',
      status: req.body?.status || 'paid',
      email: req.body?.email || req.user.email,
    }
    if (order.status === 'pending') {
      order.status = 'confirmed'
    }

    const updated = await order.save()
    res.json(updated)
  })
)

// Admin: update status
router.put(
  '/:id/status',
  orderMutationLimiter,
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { status } = req.body
    const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }

    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const previousStatus = order.status
    if (previousStatus !== 'cancelled' && status === 'cancelled') {
      await restoreOrderStock(order)
    } else if (previousStatus === 'cancelled' && status !== 'cancelled') {
      await reserveOrderStock(order)
    }

    order.status = status
    if (status === 'delivered') {
      order.isDelivered = true
      order.deliveredAt = new Date()
    } else {
      order.isDelivered = false
      order.deliveredAt = null
    }

    if (status === 'cancelled' && !order.cancelledAt) {
      order.cancelledAt = new Date()
    } else if (status !== 'cancelled') {
      order.cancelledAt = null
    }

    const updated = await order.save()
    await updated.populate('user', 'name email')
    res.json(updated)
  })
)

// Admin: delete order
router.delete(
  '/:id',
  orderMutationLimiter,
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (order.status !== 'cancelled') {
      await restoreOrderStock(order)
    }
    await order.deleteOne()
    res.json({ message: 'Order deleted' })
  })
)

// User: cancel own order (only before shipping)
router.put(
  '/:id/cancel',
  orderMutationLimiter,
  protect,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    if (!canAccessOrder(req.user, order.user)) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    if (order.status === 'cancelled') {
      return res.json(order)
    }

    if (!canCustomerCancel(order.status)) {
      return res.status(400).json({ message: 'Order can only be cancelled before confirmation' })
    }

    await restoreOrderStock(order)
    order.status = 'cancelled'
    order.cancelledAt = new Date()
    order.isDelivered = false
    order.deliveredAt = null

    const updated = await order.save()
    res.json(updated)
  })
)

module.exports = router
