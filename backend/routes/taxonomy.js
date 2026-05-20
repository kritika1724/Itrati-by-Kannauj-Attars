const express = require('express')
const { protect, adminOnly } = require('../middleware/auth')
const TaxonomyTerm = require('../models/TaxonomyTerm')
const asyncHandler = require('../utils/asyncHandler')
const { slugifyTerm } = require('../config/taxonomy')
const { getTaxonomyPayload, clearTaxonomyPayloadCache } = require('../utils/taxonomy')

const router = express.Router()
const ALLOWED_GROUPS = new Set(['purpose', 'family'])

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const payload = await getTaxonomyPayload()
    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1200')
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

module.exports = router
