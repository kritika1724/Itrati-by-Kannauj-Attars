const express = require('express')
const { protect, adminOnly } = require('../middleware/auth')
const Product = require('../models/Product')
const Order = require('../models/Order')
const ContactMessage = require('../models/ContactMessage')
const FragranceClubMember = require('../models/FragranceClubMember')
const FragranceClubCampaign = require('../models/FragranceClubCampaign')
const asyncHandler = require('../utils/asyncHandler')

const router = express.Router()
const RAZORPAY_METHODS = ['RAZORPAY', 'Razorpay', 'razorpay']

const placedOrderQuery = (extra = {}) => ({
  ...extra,
  $or: [
    { paymentMethod: { $nin: RAZORPAY_METHODS } },
    { isPaid: true },
  ],
})

router.get(
  '/stats',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const [products, orders, contactMessages, newContactMessages, newOrders, fragranceClubMembers, queuedCampaigns] = await Promise.all([
      Product.estimatedDocumentCount(),
      Order.countDocuments(placedOrderQuery()),
      ContactMessage.estimatedDocumentCount(),
      ContactMessage.countDocuments({ status: 'new' }),
      Order.countDocuments(placedOrderQuery({ status: 'pending' })),
      FragranceClubMember.countDocuments({ memberStatus: 'member' }),
      FragranceClubCampaign.countDocuments({ status: 'queued' }),
    ])

    const [recentOrders, recentContactMessages, recentFragranceClubMembers] = await Promise.all([
      Order.find(placedOrderQuery())
        .select('_id publicOrderId user shippingAddress.fullName totalPrice status createdAt')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      ContactMessage.find({})
        .select('_id name email status createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      FragranceClubMember.find({})
        .select('_id fullName mobileNumber email city state couponCode createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ])

    res.json({
      products,
      orders,
      contactMessages,
      newContactMessages,
      newOrders,
      fragranceClubMembers,
      queuedCampaigns,
      recentOrders,
      recentContactMessages,
      recentFragranceClubMembers,
    })
  })
)

module.exports = router
