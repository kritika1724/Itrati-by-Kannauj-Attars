const express = require('express')
const mongoose = require('mongoose')
const Product = require('../models/Product')
const Order = require('../models/Order')
const { protect, optionalProtect, adminOnly } = require('../middleware/auth')
const asyncHandler = require('../utils/asyncHandler')
const escapeRegex = require('../utils/escapeRegex')
const { getCache, setCache, clearCacheByPrefix } = require('../utils/appCache')
const { getPublicCacheProfile, setPublicCache } = require('../utils/cacheControl')
const {
  PRODUCTS_CACHE_KEY_PREFIX,
  PRODUCTS_LIST_CACHE_PREFIX,
  PRODUCT_DETAIL_CACHE_PREFIX,
} = require('../utils/cacheKeys')

const router = express.Router()
const PRODUCTS_CACHE_TTL_MS = Number(process.env.PRODUCTS_CACHE_TTL_MS || 60 * 60 * 1000)
const PRODUCTS_CACHE_PROFILE = getPublicCacheProfile('PRODUCTS', {
  browserMaxAge: 60,
  edgeMaxAge: 300,
  staleWhileRevalidate: 1800,
  staleIfError: 21600,
})
const PUBLIC_PRODUCT_LIST_SELECT =
  'name description shortDescription category purposeTags familyTags seasonTags genderTags directionTags featuredCollections isBestSeller isNewArrival sample availableSizesText price packs images imageZoom highlights fragranceNotes rating numReviews createdAt'
const ADMIN_PRODUCT_LIST_SELECT = `${PUBLIC_PRODUCT_LIST_SELECT} stock`
const RELATED_PRODUCTS_POPULATE_SELECT =
  'name description shortDescription category purposeTags familyTags seasonTags genderTags directionTags featuredCollections isBestSeller isNewArrival sample availableSizesText price packs.label packs.price packs.salePrice images imageZoom highlights fragranceNotes rating numReviews createdAt'

const normalizeCollections = (value) => {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map((item) => String(item || '').trim().toLowerCase()).filter(Boolean))]
}
const VALID_BUYER_TYPES = new Set(['personal', 'industrial', 'both'])
const normalizeProductText = (value) => String(value || '').trim()
const normalizeProductPrice = (value) => {
  const price = Number(value)
  return Number.isFinite(price) && price >= 0 ? price : null
}
const normalizeProductImages = (value) =>
  Array.isArray(value) ? [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))].slice(0, 12) : []
const normalizePacks = (value) =>
  Array.isArray(value)
    ? value
        .map((item) => {
          const label = String(item?.label || '').trim()
          const price = normalizeProductPrice(item?.price)
          const salePriceRaw = item?.salePrice
          const salePrice =
            salePriceRaw === null || salePriceRaw === undefined || salePriceRaw === ''
              ? null
              : normalizeProductPrice(salePriceRaw)
          const stock = normalizeProductStock(item?.stock)

          return { label, price, salePrice, stock }
        })
        .filter((item) => item.label && item.price !== null)
    : []
const validateProductPayload = ({ name, description, category, buyerType, price, images, packs, sample }) => {
  if (!name || !description || price === null) {
    return 'Name, description, and a valid price are required'
  }
  if (!category) {
    return 'Category is required'
  }
  if (!VALID_BUYER_TYPES.has(buyerType)) {
    return 'Buyer type is invalid'
  }
  if (!images.length) {
    return 'At least one product image is required'
  }
  if (packs.length === 0) {
    return 'Add at least one valid pack with price'
  }
  const invalidSalePack = packs.find(
    (pack) => pack.salePrice !== null && (pack.salePrice <= 0 || pack.salePrice >= pack.price)
  )
  if (invalidSalePack) {
    return 'Sale price must be lower than the regular pack price'
  }
  if (sample.enabled === true) {
    if (!sample.label || !Number.isFinite(sample.price) || sample.price < 0) {
      return 'Sample label and a valid sample price are required'
    }
  }
  return ''
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
const normalizeShortDescription = (value) => String(value || '').trim().slice(0, 280)
const normalizeHighlights = (value) =>
  Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean).slice(0, 3) : []
const normalizeFragranceNoteItems = (value) =>
  Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))].slice(0, 4)
    : []
const normalizeFragranceNotes = (value) => ({
  top: normalizeFragranceNoteItems(value?.top),
  heart: normalizeFragranceNoteItems(value?.heart),
  base: normalizeFragranceNoteItems(value?.base),
})
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
      const cached = await getCache(cacheKey)
      if (cached) {
        setPublicCache(res, PRODUCTS_CACHE_PROFILE)
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
    const seasonRaw = (req.query.season || '').trim()
    const genderRaw = (req.query.gender || '').trim()
    const directionRaw = (req.query.direction || '').trim()
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
        { shortDescription: { $regex: safeKeyword, $options: 'i' } },
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
    const seasons = seasonRaw
      ? seasonRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
    const genders = genderRaw
      ? genderRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
    const directions = directionRaw
      ? directionRaw
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
    if (seasons.length) filter.seasonTags = { $in: seasons }
    if (genders.length) filter.genderTags = { $in: genders }
    if (directions.length) filter.directionTags = { $in: directions }
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
      await setCache(cacheKey, payload, PRODUCTS_CACHE_TTL_MS)
      setPublicCache(res, PRODUCTS_CACHE_PROFILE)
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
      const cached = await getCache(cacheKey)
      if (cached) {
        setPublicCache(res, PRODUCTS_CACHE_PROFILE)
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
      await setCache(cacheKey, product, PRODUCTS_CACHE_TTL_MS)
      setPublicCache(res, PRODUCTS_CACHE_PROFILE)
    }

    res.json(product)
  })
)

router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const {
    name,
    description,
    shortDescription,
    category,
    buyerType,
    purposeTags,
    familyTags,
    seasonTags,
    genderTags,
    directionTags,
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
    fragranceNotes,
    detailSections,
    relatedProducts,
  } = req.body
  const normalizedName = normalizeProductText(name)
  const normalizedDescription = normalizeProductText(description)
  const normalizedCategory = normalizeProductText(category)
  const normalizedBuyerType = VALID_BUYER_TYPES.has(String(buyerType || '').trim()) ? String(buyerType).trim() : 'personal'
  const normalizedPrice = normalizeProductPrice(price)
  const normalizedImages = normalizeProductImages(images)
  const normalizedPacks = normalizePacks(packs)
  const normalizedSample = normalizeSample(sample)
  const validationError = validateProductPayload({
    name: normalizedName,
    description: normalizedDescription,
    category: normalizedCategory,
    buyerType: normalizedBuyerType,
    price: normalizedPrice,
    images: normalizedImages,
    packs: normalizedPacks,
    sample: normalizedSample,
  })

  if (validationError) {
    return res.status(400).json({ message: validationError })
  }

  const product = await Product.create({
    name: normalizedName,
    description: normalizedDescription,
    shortDescription: normalizeShortDescription(shortDescription),
    category: normalizedCategory,
    buyerType: normalizedBuyerType,
    purposeTags: Array.isArray(purposeTags) ? purposeTags : [],
    familyTags: Array.isArray(familyTags) ? familyTags : [],
    seasonTags: Array.isArray(seasonTags) ? seasonTags : [],
    genderTags: Array.isArray(genderTags) ? genderTags : [],
    directionTags: Array.isArray(directionTags) ? directionTags : [],
    featuredCollections: normalizeCollections(featuredCollections),
    isBestSeller: isBestSeller === true,
    isNewArrival: isNewArrival === true,
    sample: normalizedSample,
    availableSizesText: normalizeAvailableSizesText(availableSizesText),
    price: normalizedPrice,
    packs: normalizedPacks,
    images: normalizedImages,
    imageZoom: normalizeImageZoom(imageZoom),
    stock: normalizeProductStock(stock),
    highlights: normalizeHighlights(highlights),
    fragranceNotes: normalizeFragranceNotes(fragranceNotes),
    detailSections: normalizeDetailSections(detailSections),
    relatedProducts: normalizeRelatedProducts(relatedProducts),
  })

  await clearCacheByPrefix(PRODUCTS_CACHE_KEY_PREFIX)
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
    'shortDescription',
    'category',
    'buyerType',
    'purposeTags',
    'familyTags',
    'seasonTags',
    'genderTags',
    'directionTags',
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
    'fragranceNotes',
    'detailSections',
    'relatedProducts',
  ]
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      if (
        field === 'purposeTags' ||
        field === 'familyTags' ||
        field === 'seasonTags' ||
        field === 'genderTags' ||
        field === 'directionTags'
      ) {
        product[field] = Array.isArray(req.body[field]) ? req.body[field] : []
      } else if (field === 'featuredCollections') {
        product[field] = normalizeCollections(req.body[field])
      } else if (field === 'sample') {
        product[field] = normalizeSample(req.body[field])
      } else if (field === 'name' || field === 'description' || field === 'category') {
        product[field] = normalizeProductText(req.body[field])
      } else if (field === 'buyerType') {
        product[field] = VALID_BUYER_TYPES.has(String(req.body[field] || '').trim()) ? String(req.body[field]).trim() : 'personal'
      } else if (field === 'price') {
        product[field] = normalizeProductPrice(req.body[field])
      } else if (field === 'images') {
        product[field] = normalizeProductImages(req.body[field])
      } else if (field === 'packs') {
        product[field] = normalizePacks(req.body[field])
      } else if (field === 'stock') {
        product[field] = normalizeProductStock(req.body[field])
      } else if (field === 'imageZoom') {
        product[field] = normalizeImageZoom(req.body[field])
      } else if (field === 'availableSizesText') {
        product[field] = normalizeAvailableSizesText(req.body[field])
      } else if (field === 'shortDescription') {
        product[field] = normalizeShortDescription(req.body[field])
      } else if (field === 'highlights') {
        product[field] = normalizeHighlights(req.body[field])
      } else if (field === 'fragranceNotes') {
        product[field] = normalizeFragranceNotes(req.body[field])
      } else if (field === 'detailSections') {
        product[field] = normalizeDetailSections(req.body[field])
      } else if (field === 'relatedProducts') {
        product[field] = normalizeRelatedProducts(req.body[field], product._id)
      } else {
        product[field] = req.body[field]
      }
    }
  })

  const validationError = validateProductPayload({
    name: normalizeProductText(product.name),
    description: normalizeProductText(product.description),
    category: normalizeProductText(product.category),
    buyerType: product.buyerType,
    price: normalizeProductPrice(product.price),
    images: normalizeProductImages(product.images),
    packs: normalizePacks(product.packs),
    sample: normalizeSample(product.sample),
  })
  if (validationError) {
    return res.status(400).json({ message: validationError })
  }

  const updated = await product.save()
  await clearCacheByPrefix(PRODUCTS_CACHE_KEY_PREFIX)
  res.json(updated)
}))

router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Product not found' })
  }
  await product.deleteOne()
  await clearCacheByPrefix(PRODUCTS_CACHE_KEY_PREFIX)
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
  await clearCacheByPrefix(PRODUCTS_CACHE_KEY_PREFIX)
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
  await clearCacheByPrefix(PRODUCTS_CACHE_KEY_PREFIX)
  res.json({ message: 'Review removed' })
}))

module.exports = router
