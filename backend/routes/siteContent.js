const express = require('express')
const SiteContent = require('../models/SiteContent')
const { protect, adminOnly } = require('../middleware/auth')
const asyncHandler = require('../utils/asyncHandler')
const { getCache, setCache, deleteCache, clearCacheByPrefix } = require('../utils/appCache')
const {
  PRODUCTS_CACHE_KEY_PREFIX,
  TAXONOMY_CACHE_KEY,
  ASSETS_CACHE_KEY,
  SITE_CONTENT_CACHE_KEY,
} = require('../utils/cacheKeys')

const router = express.Router()
const SITE_CONTENT_TTL_MS = Number(process.env.SITE_CONTENT_TTL_MS || 5 * 60 * 1000)
const isPopupOrBannerKey = (key) => {
  const value = String(key || '').trim().toLowerCase()
  return value.includes('popup') || value.startsWith('banner.')
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const cached = await getCache(SITE_CONTENT_CACHE_KEY)
    if (cached) {
      res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
      return res.json(cached)
    }

    const items = await SiteContent.find({})
      .select('key value updatedAt createdAt')
      .sort({ key: 1 })
      .lean()

    await setCache(SITE_CONTENT_CACHE_KEY, items, SITE_CONTENT_TTL_MS)
    res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
    res.json(items)
  })
)

router.get(
  '/:key',
  asyncHandler(async (req, res) => {
    const item = await SiteContent.findOne({ key: req.params.key })
      .select('key value updatedAt createdAt')
      .lean()

    if (!item) return res.status(404).json({ message: 'Content not found' })
    res.json(item)
  })
)

router.put(
  '/:key',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    if (req.body?.value === undefined) {
      return res.status(400).json({ message: 'value is required' })
    }

    const key = String(req.params.key || '').trim()
    if (!key) return res.status(400).json({ message: 'Invalid key' })

    const item = await SiteContent.findOneAndUpdate(
      { key },
      { key, value: req.body.value },
      { new: true, upsert: true }
    ).lean()

    await deleteCache(SITE_CONTENT_CACHE_KEY)
    if (isPopupOrBannerKey(key)) {
      await Promise.all([
        clearCacheByPrefix(PRODUCTS_CACHE_KEY_PREFIX),
        deleteCache(TAXONOMY_CACHE_KEY),
        deleteCache(ASSETS_CACHE_KEY),
      ])
    }
    res.json(item)
  })
)

router.delete(
  '/:key',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const item = await SiteContent.findOne({ key: req.params.key })
    if (!item) return res.status(404).json({ message: 'Content not found' })

    await item.deleteOne()
    await deleteCache(SITE_CONTENT_CACHE_KEY)
    if (isPopupOrBannerKey(item.key)) {
      await Promise.all([
        clearCacheByPrefix(PRODUCTS_CACHE_KEY_PREFIX),
        deleteCache(TAXONOMY_CACHE_KEY),
        deleteCache(ASSETS_CACHE_KEY),
      ])
    }
    res.json({ message: 'Content removed' })
  })
)

module.exports = router
