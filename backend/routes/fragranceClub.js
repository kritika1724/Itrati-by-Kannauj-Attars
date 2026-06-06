const express = require('express')
const FragranceClubMember = require('../models/FragranceClubMember')
const FragranceClubCampaign = require('../models/FragranceClubCampaign')
const Order = require('../models/Order')
const { protect, adminOnly } = require('../middleware/auth')
const asyncHandler = require('../utils/asyncHandler')
const { leadCaptureLimiter } = require('../utils/rateLimit')
const { WELCOME_COUPON_CODE, WELCOME_COUPON_PERCENT } = require('../config/cartOffers')

const router = express.Router()

const normalizeMobile = (value) => String(value || '').replace(/\D/g, '').slice(-10)
const normalizeEmail = (value) => String(value || '').trim().toLowerCase()

const orderMatchesMember = (order, member) => {
  const memberEmail = normalizeEmail(member.email)
  const memberMobile = normalizeMobile(member.mobileNumber)
  const orderEmail = normalizeEmail(order?.shippingAddress?.email)
  const orderPhones = [order?.shippingAddress?.phone, order?.shippingAddress?.whatsapp]
    .map(normalizeMobile)
    .filter(Boolean)

  return Boolean(
    (memberEmail && orderEmail === memberEmail) ||
      (memberMobile && orderPhones.includes(memberMobile))
  )
}

const summarizeMemberOrders = (orders = []) => {
  const latestOrder = orders[0] || null
  const paidOrderCount = orders.filter((order) => order.isPaid === true).length

  return {
    hasOrder: orders.length > 0,
    orderCount: orders.length,
    paidOrderCount,
    latestOrder: latestOrder
      ? {
          id: latestOrder._id,
          publicOrderId: latestOrder.publicOrderId,
          totalPrice: latestOrder.totalPrice,
          status: latestOrder.status,
          paymentMethod: latestOrder.paymentMethod,
          isPaid: latestOrder.isPaid === true,
          paidAt: latestOrder.paidAt,
          createdAt: latestOrder.createdAt,
        }
      : null,
  }
}

const audienceCountQuery = (audience) => {
  switch (String(audience || 'all-members')) {
    case 'launch':
      return { memberStatus: 'member', 'campaignPreferences.launchAnnouncements': true }
    case 'seasonal':
      return { memberStatus: 'member', 'campaignPreferences.seasonalOffers': true }
    case 'birthday':
      return { memberStatus: 'member', 'campaignPreferences.birthdayCoupons': true }
    case 'abandoned-cart':
      return { memberStatus: 'member', 'campaignPreferences.abandonedCartReminders': true }
    default:
      return { memberStatus: 'member' }
  }
}

const duplicateFieldMessage = (duplicateFields = []) => {
  if (duplicateFields.includes('mobileNumber') && duplicateFields.includes('email')) {
    return 'This mobile number and email are already in our database. Please fill new details to unlock this reward.'
  }
  if (duplicateFields.includes('mobileNumber')) {
    return 'This mobile number is already in our database. Please fill new details to unlock this reward.'
  }
  return 'This email address is already in our database. Please fill new details to unlock this reward.'
}

const joinHandler = asyncHandler(async (req, res) => {
  const fullName = String(req.body?.fullName || '').trim()
  const mobileNumber = String(req.body?.mobileNumber || '').trim()
  const email = String(req.body?.email || '').trim().toLowerCase()
  const addressLine1 = String(req.body?.addressLine1 || '').trim()
  const city = String(req.body?.city || '').trim()
  const state = String(req.body?.state || '').trim()
  const cartItems = Array.isArray(req.body?.cartItems)
    ? req.body.cartItems.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 20)
    : []
  const cartValue = Math.max(0, Number(req.body?.cartValue || 0))
  const normalizedMobile = normalizeMobile(mobileNumber)

  if (!fullName || !normalizedMobile || !email || !addressLine1 || !city || !state) {
    return res.status(400).json({ message: 'Full name, mobile number, email, address, city, and state are required.' })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Enter a valid email address.' })
  }

  const [existingMobile, existingEmail] = await Promise.all([
    normalizedMobile ? FragranceClubMember.findOne({ normalizedMobile }).select('_id').lean() : null,
    email ? FragranceClubMember.findOne({ email }).select('_id').lean() : null,
  ])

  const duplicateFields = [
    ...(existingMobile ? ['mobileNumber'] : []),
    ...(existingEmail ? ['email'] : []),
  ]

  if (duplicateFields.length) {
    return res.status(409).json({
      field: duplicateFields[0],
      duplicateFields,
      message: duplicateFieldMessage(duplicateFields),
    })
  }

  const payload = {
    fullName,
    mobileNumber,
    email,
    addressLine1,
    city,
    state,
    memberStatus: 'member',
    tags: ['Fragrance Club Member'],
    couponCode: WELCOME_COUPON_CODE,
    discountPercent: WELCOME_COUPON_PERCENT,
    source: 'add-to-cart',
    rewardUnlockedAt: new Date(),
    lastCartActivityAt: new Date(),
    cartItems,
    cartValue,
    campaignPreferences: {
      abandonedCartReminders: true,
      launchAnnouncements: true,
      seasonalOffers: true,
      birthdayCoupons: true,
    },
  }

  let member
  try {
    member = await FragranceClubMember.create(payload)
  } catch (error) {
    if (error?.code === 11000) {
      const duplicateKey = Object.keys(error.keyPattern || {})[0]
      const duplicateKeyFields =
        duplicateKey === 'normalizedMobile' ? ['mobileNumber'] : duplicateKey === 'email' ? ['email'] : []
      return res.status(409).json({
        field: duplicateKeyFields[0] || '',
        duplicateFields: duplicateKeyFields,
        message: duplicateFieldMessage(duplicateKeyFields.length ? duplicateKeyFields : ['mobileNumber']),
      })
    }
    throw error
  }

  res.status(201).json({
    success: true,
    member: {
      id: member._id,
      fullName: member.fullName,
      mobileNumber: member.mobileNumber,
      email: member.email,
      addressLine1: member.addressLine1,
      city: member.city,
      state: member.state,
      tags: member.tags,
      memberStatus: member.memberStatus,
    },
    coupon: {
      code: WELCOME_COUPON_CODE,
      discountPercent: WELCOME_COUPON_PERCENT,
    },
  })
})

router.post(
  '/join',
  leadCaptureLimiter,
  joinHandler
)

router.post('/', leadCaptureLimiter, joinHandler)

router.get(
  '/members',
  protect,
  adminOnly,
  asyncHandler(async (_req, res) => {
    const members = await FragranceClubMember.find({})
      .sort({ createdAt: -1 })
      .lean()

    const earliestMemberDate = members.reduce((earliest, member) => {
      const time = member.createdAt ? new Date(member.createdAt).getTime() : 0
      if (!Number.isFinite(time) || time <= 0) return earliest
      return earliest && earliest.getTime() <= time ? earliest : new Date(time)
    }, null)

    const orders = earliestMemberDate
      ? await Order.find({ createdAt: { $gte: earliestMemberDate } })
          .select('_id publicOrderId shippingAddress.email shippingAddress.phone shippingAddress.whatsapp totalPrice paymentMethod isPaid paidAt status createdAt')
          .sort({ createdAt: -1 })
          .lean()
      : []

    const membersWithOrders = members.map((member) => {
      const memberCreatedAt = member.createdAt ? new Date(member.createdAt).getTime() : 0
      const matchingOrders = orders.filter((order) => {
        const orderCreatedAt = order.createdAt ? new Date(order.createdAt).getTime() : 0
        return orderCreatedAt >= memberCreatedAt && orderMatchesMember(order, member)
      })

      return {
        ...member,
        orderSummary: summarizeMemberOrders(matchingOrders),
      }
    })

    res.json(membersWithOrders)
  })
)

router.get(
  '/campaigns',
  protect,
  adminOnly,
  asyncHandler(async (_req, res) => {
    const campaigns = await FragranceClubCampaign.find({})
      .sort({ createdAt: -1 })
      .lean()
    res.json(campaigns)
  })
)

router.post(
  '/campaigns',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const title = String(req.body?.title || '').trim()
    const message = String(req.body?.message || '').trim()
    const channel = String(req.body?.channel || 'mixed').trim()
    const audience = String(req.body?.audience || 'all-members').trim()
    const couponCode = String(req.body?.couponCode || '').trim().toUpperCase()
    const notes = String(req.body?.notes || '').trim()
    const scheduledFor = req.body?.scheduledFor ? new Date(req.body.scheduledFor) : null

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required.' })
    }

    const targetCount = await FragranceClubMember.countDocuments(audienceCountQuery(audience))

    const campaign = await FragranceClubCampaign.create({
      title,
      message,
      channel,
      audience,
      couponCode,
      notes,
      scheduledFor,
      targetCount,
      createdBy: req.user?.email || '',
    })

    res.status(201).json(campaign)
  })
)

router.put(
  '/campaigns/:id/status',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const status = String(req.body?.status || '').trim()
    if (!['draft', 'queued', 'sent'].includes(status)) {
      return res.status(400).json({ message: 'Invalid campaign status.' })
    }

    const campaign = await FragranceClubCampaign.findById(req.params.id)
    if (!campaign) return res.status(404).json({ message: 'Campaign not found.' })

    campaign.status = status
    campaign.sentAt = status === 'sent' ? new Date() : null
    await campaign.save()

    res.json(campaign)
  })
)

module.exports = router
