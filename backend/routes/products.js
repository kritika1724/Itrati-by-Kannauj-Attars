const express = require('express')
const mongoose = require('mongoose')
const Product = require('../models/Product')
const Order = require('../models/Order')
const { protect, optionalProtect, adminOnly } = require('../middleware/auth')
const asyncHandler = require('../utils/asyncHandler')
const escapeRegex = require('../utils/escapeRegex')
const { getCache, setCache, clearCacheByPrefix } = require('../utils/appCache')

const router = express.Router()
const PRODUCTS_LIST_CACHE_PREFIX = 'products:list:'
const PRODUCT_DETAIL_CACHE_PREFIX = 'products:detail:'
const PRODUCTS_CACHE_TTL_MS = Number(process.env.PRODUCTS_CACHE_TTL_MS || 30 * 1000)
const PUBLIC_PRODUCT_LIST_SELECT =
  'name description category purposeTags familyTags featuredCollections isBestSeller isNewArrival sample availableSizesText price packs images imageZoom highlights rating numReviews createdAt'
const ADMIN_PRODUCT_LIST_SELECT = `${PUBLIC_PRODUCT_LIST_SELECT} stock`
const RELATED_PRODUCTS_POPULATE_SELECT =
  'name description category purposeTags familyTags featuredCollections isBestSeller isNewArrival sample availableSizesText price packs.label packs.price packs.salePrice images imageZoom highlights rating numReviews createdAt'

const normalizeCollections = (value) => {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean))]
}

const normalizeSample = (value) => {
  if (value?.enabled !== true) {
    return { enabled: false, label: '', price: 0 }
  }

  const label = String(value?.label || '').trim()
  const price = Number(value?.price)

  return {
    enabled: true,
    label,
    price: Number.isFinite(price) ? price : 0,
  }
}

const normalizeProductStock = (value) => {
  const stock = Number(value)
  if (!Number.isFinite(stock) || stock < 0) return 0
  return Math.floor(stock)
}

const normalizeImageZoom = (value) => {
  const zoom = Number(value)
  if (!Number.isFinite(zoom)) return 1
  return Math.min(Math.max(zoom, 1), 2.5)
}

const normalizeAvailableSizesText = (value) => String(value || '').trim()
const normalizeHighlights = (value) =>
  Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3) : []
const normalizeDetailSections = (value) =>
  Array.isArray(value)
    ? value
        .map((item) => ({
          title: String(item?.title || '').trim(),
          content: String(item?.content || '').trim(),
        }))
        .filter((item) => item.title && item.content)
    : []
const normalizeRelatedProducts = (value, selfId = '') =>
  Array.isArray(value)
    ? [
        ...new Set(
          value
            .map((item) => String(item?._id || item || '').trim())
            .filter((itemId) => itemId && mongoose.isValidObjectId(itemId) && itemId !== String(selfId || ''))
        ),
      ].slice(0, 6)
    : []

const findReviewOrder = async (orderId) => {
  const value = String(orderId || '').trim()
  if (!value) return null

  const normalizedPublicOrderId = value.toUpperCase()
  let order = await Order.findOne({ publicOrderId: normalizedPublicOrderId })
    .select('_id publicOrderId status orderItems.product shippingAddress.fullName')
    .lean()

  if (!order && mongoose.isValidObjectId(value)) {
    order = await Order.findById(value)
      .select('_id publicOrderId status orderItems.product shippingAddress.fullName')
      .lean()
  }

  return order
}

router.get(
  '/',
  optionalProtect,
  asyncHandler(async (req, res) => {
    const canUsePublicCache = req.user?.isAdmin !== true
    const cacheKey = canUsePublicCache ? `${PRODUCTS_LIST_CACHE_PREFIX}${req.originalUrl}` : ''
    if (cacheKey) {
      const cached = getCache(cacheKey)
      if (cached) {
        res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120')
        return res.json(cached)
      }
    }

    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 100)
    const skip = (page - 1) * limit

    const keyword = (req.query.keyword || '').trim()
    const category = (req.query.category || '').trim()
    const buyer = (req.query.buyer || '').trim()
    const purposeRaw = (req.query.purpose || '').trim()
    const familyRaw = (req.query.family || '').trim()
    const collectionRaw = (req.query.collection || '').trim()
    const bestSeller = (req.query.bestSeller || '').toString().trim()
    const minPrice = req.query.minPrice !== undefined ? Number(req.query.minPrice) : undefined
    const maxPrice = req.query.maxPrice !== undefined ? Number(req.query.maxPrice) : undefined
    const sort = (req.query.sort || 'newest').trim()

    const filter = {}
    if (keyword) {
      const safeKeyword = escapeRegex(keyword)
      filter.$or = [
        { name: { $regex: safeKeyword, $options: 'i' } },
        { description: { $regex: safeKeyword, $options: 'i' } },
      ]
    }
    if (category) {
      filter.category = category
    }
    if (buyer === 'personal') {
      filter.buyerType = { $in: ['personal', 'both'] }
    } else if (buyer === 'industrial') {
      filter.buyerType = { $in: ['industrial', 'both'] }
    }

    const purposes = purposeRaw
      ? purposeRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
    const families = familyRaw
      ? familyRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
    const collections = collectionRaw
      ? collectionRaw
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      : []

    if (purposes.length) filter.purposeTags = { $in: purposes }
    if (families.length) filter.familyTags = { $in: families }
    if (collections.length) filter.featuredCollections = { $in: collections }
    if (bestSeller && ['1', 'true', 'yes', 'on'].includes(bestSeller.toLowerCase())) {
      filter.isBestSeller = true
    }
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {}
      if (minPrice !== undefined && !Number.isNaN(minPrice)) filter.price.$gte = minPrice
      if (maxPrice !== undefined && !Number.isNaN(maxPrice)) filter.price.$lte = maxPrice
    }

    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating_desc: { rating: -1 },
      name_asc: { name: 1 },
    }

    const sortObj = sortMap[sort] || sortMap.newest

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .select(req.user?.isAdmin === true ? ADMIN_PRODUCT_LIST_SELECT : PUBLIC_PRODUCT_LIST_SELECT)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
    ])

    const payload = {
      products,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      total,
    }

    if (cacheKey) {
      setCache(cacheKey, payload, PRODUCTS_CACHE_TTL_MS)
      res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120')
    }

    res.json(payload)
  })
)

router.get(
  '/:id',
  optionalProtect,
  asyncHandler(async (req, res) => {
    const canUsePublicCache = req.user?.isAdmin !== true
    const cacheKey = canUsePublicCache ? `${PRODUCT_DETAIL_CACHE_PREFIX}${req.params.id}` : ''
    if (cacheKey) {
      const cached = getCache(cacheKey)
      if (cached) {
        res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120')
        return res.json(cached)
      }
    }

    const query = Product.findById(req.params.id).populate({
      path: 'relatedProducts',
      select: RELATED_PRODUCTS_POPULATE_SELECT,
    })
    if (req.user?.isAdmin !== true) {
      query.select('-stock -packs.stock')
    }
    const product = await query.lean()
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    if (cacheKey) {
      setCache(cacheKey, product, PRODUCTS_CACHE_TTL_MS)
      res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120')
    }

    res.json(product)
  })
)

router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const {
    name,
    description,
    category,
    buyerType,
    purposeTags,
    familyTags,
    featuredCollections,
    isBestSeller,
    isNewArrival,
    sample,
    availableSizesText,
    price,
    packs,
    images,
    imageZoom,
    stock,
    highlights,
    detailSections,
    relatedProducts,
  } = req.body

  if (!name || !description || price === undefined) {
    return res.status(400).json({ message: 'Name, description, and price are required' })
  }

  const product = await Product.create({
    name,
    description,
    category,
    buyerType,
    purposeTags: Array.isArray(purposeTags) ? purposeTags : [],
    familyTags: Array.isArray(familyTags) ? familyTags : [],
    featuredCollections: normalizeCollections(featuredCollections),
    isBestSeller: isBestSeller === true,
    isNewArrival: isNewArrival === true,
    sample: normalizeSample(sample),
    availableSizesText: normalizeAvailableSizesText(availableSizesText),
    price,
    packs: Array.isArray(packs) ? packs : [],
    images,
    imageZoom: normalizeImageZoom(imageZoom),
    stock: normalizeProductStock(stock),
    highlights: normalizeHighlights(highlights),
    detailSections: normalizeDetailSections(detailSections),
    relatedProducts: normalizeRelatedProducts(relatedProducts),
  })

  clearCacheByPrefix(PRODUCTS_LIST_CACHE_PREFIX)
  clearCacheByPrefix(PRODUCT_DETAIL_CACHE_PREFIX)
  res.status(201).json(product)
}))

router.put('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  const fields = [
    'name',
    'description',
    'category',
    'buyerType',
    'purposeTags',
    'familyTags',
    'featuredCollections',
    'isBestSeller',
    'isNewArrival',
    'sample',
    'availableSizesText',
    'price',
    'packs',
    'images',
    'imageZoom',
    'stock',
    'highlights',
    'detailSections',
    'relatedProducts',
  ]
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (field === 'purposeTags' || field === 'familyTags') {
        product[field] = Array.isArray(req.body[field]) ? req.body[field] : []
      } else if (field === 'featuredCollections') {
        product[field] = normalizeCollections(req.body[field])
      } else if (field === 'sample') {
        product[field] = normalizeSample(req.body[field])
      } else if (field === 'stock') {
        product[field] = normalizeProductStock(req.body[field])
      } else if (field === 'imageZoom') {
        product[field] = normalizeImageZoom(req.body[field])
      } else if (field === 'availableSizesText') {
        product[field] = normalizeAvailableSizesText(req.body[field])
      } else if (field === 'highlights') {
        product[field] = normalizeHighlights(req.body[field])
      } else if (field === 'detailSections') {
        product[field] = normalizeDetailSections(req.body[field])
      } else if (field === 'relatedProducts') {
        product[field] = normalizeRelatedProducts(req.body[field], product._id)
      } else {
        product[field] = req.body[field]
      }
    }
  })

  const updated = await product.save()
  clearCacheByPrefix(PRODUCTS_LIST_CACHE_PREFIX)
  clearCacheByPrefix(PRODUCT_DETAIL_CACHE_PREFIX)
  res.json(updated)
}))

router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }
  await product.deleteOne()
  clearCacheByPrefix(PRODUCTS_LIST_CACHE_PREFIX)
  clearCacheByPrefix(PRODUCT_DETAIL_CACHE_PREFIX)
  res.json({ message: 'Product deleted' })
}))

router.post('/:id/reviews', optionalProtect, asyncHandler(async (req, res) => {
  if (req.user?.isAdmin === true) {
    return res.status(403).json({ message: 'Admins cannot submit reviews' })
  }

  const { rating, comment, orderId } = req.body
  const numericRating = Number(rating)

  if (!orderId) {
    return res.status(400).json({ message: 'Order ID is required' })
  }

  if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5 stars' })
  }

  const product = await Product.findById(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  const order = await findReviewOrder(orderId)
  if (!order) {
    return res.status(404).json({ message: 'Order not found' })
  }

  const normalizedOrderStatus = String(order.status || '').toLowerCase()
  if (normalizedOrderStatus !== 'delivered') {
    return res.status(400).json({ message: 'Review can be submitted only after the order is delivered' })
  }

  const orderedProduct = Array.isArray(order.orderItems)
    ? order.orderItems.find((item) => String(item.product) === String(product._id))
    : null

  if (!orderedProduct) {
    return res.status(400).json({ message: 'This product was not included in the provided order' })
  }

  const reviewOrderId = String(order.publicOrderId || order._id)
  const alreadyReviewed = product.reviews.find(
    (review) =>
      (review.order && String(review.order) === String(order._id)) ||
      (review.publicOrderId && String(review.publicOrderId) === reviewOrderId)
  )

  if (alreadyReviewed) {
    return res.status(400).json({ message: 'A review for this product has already been submitted with this order ID' })
  }

  product.reviews.push({
    user: req.user?._id || null,
    order: order._id,
    publicOrderId: reviewOrderId,
    name: String(order.shippingAddress?.fullName || req.user?.name || 'Verified buyer').trim(),
    rating: numericRating,
    comment: String(comment || '').trim(),
    verifiedPurchase: true,
  })
  product.numReviews = product.reviews.length
  product.rating =
    product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.numReviews

  await product.save()
  clearCacheByPrefix(PRODUCTS_LIST_CACHE_PREFIX)
  clearCacheByPrefix(PRODUCT_DETAIL_CACHE_PREFIX)
  res.status(201).json({ message: 'Review added' })
}))

router.delete('/:id/reviews/:reviewId', protect, adminOnly, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }

  const reviewIndex = product.reviews.findIndex(
    (review) => review._id.toString() === req.params.reviewId
  )

  if (reviewIndex === -1) {
    return res.status(404).json({ message: 'Review not found' })
  }

  product.reviews.splice(reviewIndex, 1)
  product.numReviews = product.reviews.length
  product.rating = product.numReviews
    ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.numReviews
    : 0

  await product.save()
  clearCacheByPrefix(PRODUCTS_LIST_CACHE_PREFIX)
  clearCacheByPrefix(PRODUCT_DETAIL_CACHE_PREFIX)
  res.json({ message: 'Review removed' })
}))

module.exports = router
