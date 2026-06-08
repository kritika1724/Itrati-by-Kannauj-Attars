const express = require('express')
const GallerySection = require('../models/GallerySection')
const GalleryPhoto = require('../models/GalleryPhoto')
const { protect, adminOnly } = require('../middleware/auth')
const asyncHandler = require('../utils/asyncHandler')

const router = express.Router()

const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.m4v', '.ogg']

const inferMediaKind = (url) => {
  const clean = String(url || '').split('#')[0].split('?')[0].toLowerCase()
  return VIDEO_EXTS.some((ext) => clean.endsWith(ext)) ? 'video' : 'image'
}

const normalizeMediaKind = (value, url) => {
  const kind = String(value || '').trim().toLowerCase()
  if (kind === 'video' || kind === 'image') return kind
  return inferMediaKind(url)
}

// Public: all sections with photos
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const sections = await GallerySection.find({ isActive: true })
      .select('title description order isActive createdAt')
      .sort({ order: 1, createdAt: 1 })
      .lean()

    const sectionIds = sections.map((s) => s._id)
    const [photos, standaloneMedia] = await Promise.all([
      sectionIds.length
        ? GalleryPhoto.find({ section: { $in: sectionIds } })
            .select('section url kind caption order createdAt')
            .sort({ order: 1, createdAt: 1 })
            .lean()
        : [],
      GalleryPhoto.find({ $or: [{ section: null }, { section: { $exists: false } }] })
        .select('section url kind caption order createdAt')
        .sort({ order: 1, createdAt: 1 })
        .lean(),
    ])

    const bySection = photos.reduce((acc, p) => {
      const id = String(p.section)
      if (!acc[id]) acc[id] = []
      acc[id].push(p)
      return acc
    }, {})

    res.json({
      standaloneMedia,
      sections: sections.map((s) => ({
        ...s,
        photos: bySection[String(s._id)] || [],
      })),
    })
  })
)

// Admin: create section
router.post(
  '/sections',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { title, description = '', order = 0 } = req.body || {}
    const t = String(title || '').trim()
    if (!t) return res.status(400).json({ message: 'title is required' })

    const section = await GallerySection.create({
      title: t,
      description: String(description || '').trim(),
      order: Number.isFinite(Number(order)) ? Number(order) : 0,
    })

    res.status(201).json(section)
  })
)

// Admin: update section
router.put(
  '/sections/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const section = await GallerySection.findById(req.params.id)
    if (!section) return res.status(404).json({ message: 'Section not found' })

    const { title, description, order, isActive } = req.body || {}

    if (title !== undefined) section.title = String(title || '').trim()
    if (description !== undefined) section.description = String(description || '').trim()
    if (order !== undefined && Number.isFinite(Number(order))) section.order = Number(order)
    if (isActive !== undefined) section.isActive = Boolean(isActive)

    if (!section.title) return res.status(400).json({ message: 'title is required' })

    const updated = await section.save()
    res.json(updated)
  })
)

// Admin: delete section (+ photos)
router.delete(
  '/sections/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const section = await GallerySection.findById(req.params.id)
    if (!section) return res.status(404).json({ message: 'Section not found' })

    await GalleryPhoto.deleteMany({ section: section._id })
    await section.deleteOne()
    res.json({ message: 'Section removed' })
  })
)

// Admin: add photo to section
router.post(
  '/sections/:id/photos',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const section = await GallerySection.findById(req.params.id)
    if (!section) return res.status(404).json({ message: 'Section not found' })

    const { url, kind, caption = '', order = 0 } = req.body || {}
    const u = String(url || '').trim()
    if (!u) return res.status(400).json({ message: 'url is required' })

    const photo = await GalleryPhoto.create({
      section: section._id,
      url: u,
      kind: normalizeMediaKind(kind, u),
      caption: String(caption || '').trim(),
      order: Number.isFinite(Number(order)) ? Number(order) : 0,
    })

    res.status(201).json(photo)
  })
)

// Admin: add standalone photo/media without a topic
router.post(
  '/photos',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { url, kind, caption = '', order = 0 } = req.body || {}
    const u = String(url || '').trim()
    if (!u) return res.status(400).json({ message: 'url is required' })

    const photo = await GalleryPhoto.create({
      section: null,
      url: u,
      kind: normalizeMediaKind(kind, u),
      caption: String(caption || '').trim(),
      order: Number.isFinite(Number(order)) ? Number(order) : 0,
    })

    res.status(201).json(photo)
  })
)

// Admin: update photo/media metadata
router.put(
  '/photos/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const photo = await GalleryPhoto.findById(req.params.id)
    if (!photo) return res.status(404).json({ message: 'Photo not found' })

    const { caption, order, kind } = req.body || {}
    if (caption !== undefined) photo.caption = String(caption || '').trim()
    if (order !== undefined && Number.isFinite(Number(order))) photo.order = Number(order)
    if (kind !== undefined) photo.kind = normalizeMediaKind(kind, photo.url)

    const updated = await photo.save()
    res.json(updated)
  })
)

// Admin: delete photo
router.delete(
  '/photos/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const photo = await GalleryPhoto.findById(req.params.id)
    if (!photo) return res.status(404).json({ message: 'Photo not found' })
    await photo.deleteOne()
    res.json({ message: 'Photo removed' })
  })
)

module.exports = router
