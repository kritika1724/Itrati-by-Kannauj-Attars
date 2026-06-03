const express = require('express')
const { protect, adminOnly } = require('../middleware/auth')
const TaxonomyTerm = require('../models/TaxonomyTerm')
const Product = require('../models/Product')
const asyncHandler = require('../utils/asyncHandler')
const { slugifyTerm } = require('../config/taxonomy')
const { getTaxonomyPayload, clearTaxonomyPayloadCache } = require('../utils/taxonomy')
const { clearCacheByPrefix } = require('../utils/appCache')
const { getPublicCacheProfile, setPublicCache } = require('../utils/cacheControl')

const router = express.Router()
const ALLOWED_GROUPS = new Set(['purpose', 'family', 'season', 'gender', 'collection'])
const RESERVED_COLLECTIONS = new Set(['signature', 'heritage'])
const PRODUCTS_LIST_CACHE_PREFIX = 'products:list:'
const PRODUCT_DETAIL_CACHE_PREFIX = 'products:detail:'
const TAXONOMY_CACHE_PROFILE = getPublicCacheProfile('TAXONOMY', {
  browserMaxAge: 300,
  edgeMaxAge: 1800,
  staleWhileRevalidate: 21600,
  staleIfError: 86400,
})

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const payload = await getTaxonomyPayload()
    setPublicCache(res, TAXONOMY_CACHE_PROFILE)
    res.json(payload)
  })
)

router.post(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const group = String(req.body?.group || '')
      .trim()
      .toLowerCase()
    const label = String(req.body?.label || '').trim()

    if (!ALLOWED_GROUPS.has(group)) {
      return res.status(400).json({ message: 'Filter type is invalid' })
    }

    if (!label) {
      return res.status(400).json({ message: 'Filter label is required' })
    }

    const slug = slugifyTerm(label)
    if (!slug) {
      return res.status(400).json({ message: 'Filter label is invalid' })
    }

    const existing = await TaxonomyTerm.findOne({ group, slug }).lean()
    if (existing) {
      return res.status(200).json({
        message: 'Filter already exists',
        term: { id: existing.slug, label: existing.label, group: existing.group },
      })
    }

    const lastTerm = await TaxonomyTerm.findOne({ group }).sort({ sortOrder: -1, createdAt: -1 }).lean()

    const created = await TaxonomyTerm.create({
      group,
      slug,
      label,
      sortOrder: (lastTerm?.sortOrder || 0) + 10,
      isActive: true,
    })

    clearTaxonomyPayloadCache()

    res.status(201).json({
      message: 'Filter created',
      term: { id: created.slug, label: created.label, group: created.group },
    })
  })
)

router.put(
  '/:group/:slug',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const group = String(req.params?.group || '')
      .trim()
      .toLowerCase()
    const slug = String(req.params?.slug || '')
      .trim()
      .toLowerCase()
    const label = String(req.body?.label || '').trim()

    if (!ALLOWED_GROUPS.has(group)) {
      return res.status(400).json({ message: 'Filter type is invalid' })
    }

    if (!slug) {
      return res.status(400).json({ message: 'Filter id is required' })
    }

    if (!label) {
      return res.status(400).json({ message: 'Filter label is required' })
    }

    const term = await TaxonomyTerm.findOne({ group, slug })
    if (!term) {
      return res.status(404).json({ message: 'Filter not found' })
    }

    term.label = label
    await term.save()
    clearTaxonomyPayloadCache()

    res.json({
      message: group === 'collection' ? 'Collection updated' : 'Filter updated',
      term: { id: term.slug, label: term.label, group: term.group },
    })
  })
)

router.delete(
  '/:group/:slug',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const group = String(req.params?.group || '')
      .trim()
      .toLowerCase()
    const slug = String(req.params?.slug || '')
      .trim()
      .toLowerCase()

    if (!ALLOWED_GROUPS.has(group)) {
      return res.status(400).json({ message: 'Filter type is invalid' })
    }

    if (!slug) {
      return res.status(400).json({ message: 'Filter id is required' })
    }

    if (group === 'collection' && RESERVED_COLLECTIONS.has(slug)) {
      return res.status(400).json({ message: 'This collection is reserved and cannot be deleted' })
    }

    const term = await TaxonomyTerm.findOne({ group, slug })
    if (!term) {
      return res.status(404).json({ message: 'Filter not found' })
    }

    if (group === 'collection') {
      await Product.updateMany({ featuredCollections: slug }, { $pull: { featuredCollections: slug } })
    } else if (group === 'purpose') {
      await Product.updateMany({ purposeTags: slug }, { $pull: { purposeTags: slug } })
    } else if (group === 'family') {
      await Product.updateMany({ familyTags: slug }, { $pull: { familyTags: slug } })
    } else if (group === 'season') {
      await Product.updateMany({ seasonTags: slug }, { $pull: { seasonTags: slug } })
    } else if (group === 'gender') {
      await Product.updateMany({ genderTags: slug }, { $pull: { genderTags: slug } })
    }

    await term.deleteOne()
    clearTaxonomyPayloadCache()
    clearCacheByPrefix(PRODUCTS_LIST_CACHE_PREFIX)
    clearCacheByPrefix(PRODUCT_DETAIL_CACHE_PREFIX)

    res.json({
      message: group === 'collection' ? 'Collection deleted' : 'Filter deleted',
    })
  })
)

module.exports = router
