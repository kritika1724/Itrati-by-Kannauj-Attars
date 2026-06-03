const TaxonomyTerm = require('../models/TaxonomyTerm')
const { DEFAULT_TAXONOMY_TERMS } = require('../config/taxonomy')
const { getCache, setCache, deleteCache } = require('./appCache')

const TAXONOMY_CACHE_KEY = 'taxonomy:payload'
const TAXONOMY_TTL_MS = Number(process.env.TAXONOMY_CACHE_TTL_MS || 10 * 60 * 1000)

const ensureDefaultTaxonomy = async () => {
  if (!Array.isArray(DEFAULT_TAXONOMY_TERMS) || DEFAULT_TAXONOMY_TERMS.length === 0) return

  await Promise.all(
    DEFAULT_TAXONOMY_TERMS.map((term) =>
      TaxonomyTerm.updateOne(
        { group: term.group, slug: term.slug },
        {
          $setOnInsert: {
            label: term.label,
            sortOrder: term.sortOrder,
            isActive: true,
          },
        },
        { upsert: true }
      )
    )
  )
}

const getTaxonomyPayload = async () => {
  const cached = getCache(TAXONOMY_CACHE_KEY)
  if (cached) return cached

  const [purposes, families, seasons, genders, collections] = await Promise.all([
    TaxonomyTerm.find({ group: 'purpose', isActive: true })
      .sort({ sortOrder: 1, label: 1 })
      .select('slug label sortOrder')
      .lean(),
    TaxonomyTerm.find({ group: 'family', isActive: true })
      .sort({ sortOrder: 1, label: 1 })
      .select('slug label sortOrder')
      .lean(),
    TaxonomyTerm.find({ group: 'season', isActive: true })
      .sort({ sortOrder: 1, label: 1 })
      .select('slug label sortOrder')
      .lean(),
    TaxonomyTerm.find({ group: 'gender', isActive: true })
      .sort({ sortOrder: 1, label: 1 })
      .select('slug label sortOrder')
      .lean(),
    TaxonomyTerm.find({ group: 'collection', isActive: true })
      .sort({ sortOrder: 1, label: 1 })
      .select('slug label sortOrder')
      .lean(),
  ])

  const payload = {
    purposes: purposes.map((term) => ({
      id: term.slug,
      label: term.label,
      sortOrder: term.sortOrder || 0,
    })),
    families: families.map((term) => ({
      id: term.slug,
      label: term.label,
      sortOrder: term.sortOrder || 0,
    })),
    seasons: seasons.map((term) => ({
      id: term.slug,
      label: term.label,
      sortOrder: term.sortOrder || 0,
    })),
    genders: genders.map((term) => ({
      id: term.slug,
      label: term.label,
      sortOrder: term.sortOrder || 0,
    })),
    collections: collections.map((term) => ({
      id: term.slug,
      label: term.label,
      sortOrder: term.sortOrder || 0,
    })),
  }

  setCache(TAXONOMY_CACHE_KEY, payload, TAXONOMY_TTL_MS)
  return payload
}

const clearTaxonomyPayloadCache = () => {
  deleteCache(TAXONOMY_CACHE_KEY)
}

module.exports = { ensureDefaultTaxonomy, getTaxonomyPayload, clearTaxonomyPayloadCache }
