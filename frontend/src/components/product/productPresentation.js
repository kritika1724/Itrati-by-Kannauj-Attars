import { BUSINESS } from '../../config/business'

const CATEGORY_FALLBACKS = {
  attar: ['Floral', 'Traditional', 'Long-lasting'],
  perfume: ['Refined', 'Modern', 'Premium'],
  'rose water': ['Fresh', 'Soft', 'Botanical'],
  'essential oil': ['Pure', 'Aromatic', 'Therapeutic'],
}

const NOTE_LIBRARY = {
  floral: {
    top: ['Rose dew', 'Green citrus'],
    heart: ['Motia bloom', 'Jasmine silk'],
    base: ['Sandalwood', 'White musk'],
  },
  woody: {
    top: ['Dry cedar', 'Spiced citrus'],
    heart: ['Soft oud wood', 'Velvet bark'],
    base: ['Amber wood', 'Smoked sandal'],
  },
  musky: {
    top: ['Clean spice', 'Powdered iris'],
    heart: ['Soft skin musk', 'Warm floral threads'],
    base: ['Cashmere wood', 'Amber resin'],
  },
  musk: {
    top: ['Clean spice', 'Powdered iris'],
    heart: ['Soft skin musk', 'Warm floral threads'],
    base: ['Cashmere wood', 'Amber resin'],
  },
  oudh: {
    top: ['Dry saffron', 'Resin spark'],
    heart: ['Oudh wood', 'Smoked rose'],
    base: ['Dark amber', 'Sacred balsam'],
  },
  oudh: {
    top: ['Dry saffron', 'Resin spark'],
    heart: ['Oudh wood', 'Smoked rose'],
    base: ['Dark amber', 'Sacred balsam'],
  },
  fresh: {
    top: ['Crisp green lift', 'Morning citrus'],
    heart: ['Soft petals', 'Cooling herbs'],
    base: ['Clean woods', 'Sheer musk'],
  },
  spicy: {
    top: ['Cardamom spark', 'Saffron thread'],
    heart: ['Clove warmth', 'Spiced florals'],
    base: ['Ambered woods', 'Velvet resin'],
  },
  aquatic: {
    top: ['Cool bergamot', 'Mineral breeze'],
    heart: ['Transparent florals', 'Clean herbs'],
    base: ['White woods', 'Soft musk'],
  },
  oriental: {
    top: ['Saffron glow', 'Dry citrus'],
    heart: ['Velvet florals', 'Balsamic spice'],
    base: ['Amber', 'Sandalwood'],
  },
  gourmand: {
    top: ['Toasted spice', 'Candied citrus'],
    heart: ['Creamy florals', 'Sweet resin'],
    base: ['Vanilla amber', 'Soft woods'],
  },
  default: {
    top: ['Bright opening', 'Fresh nuance'],
    heart: ['Balanced floral core', 'Attar depth'],
    base: ['Soft woods', 'Long warm trail'],
  },
}

const PURPOSE_COPY = {
  daily_wear: 'Balanced for everyday wear with a calm, polished trail.',
  weddings: 'Composed for celebration, ceremony, and memorable presence.',
  luxury_gifting: 'Presented with gifting elegance and a premium finish.',
  festive: 'Shaped for festive occasions, warmth, and gracious projection.',
  meditation_spiritual: 'Designed for quiet rituals, spiritual calm, and reflective spaces.',
  skin_hair: 'Soft enough for self-care routines and botanical beauty rituals.',
  candle_making: 'Layered to support warm diffusion and atmospheric fragrance work.',
  soap_cosmetic_mfg: 'Curated for formulations that need stable aromatic character.',
  industrial_use: 'Suitable for larger scale blending, supply, and technical use cases.',
}

const formatLabel = (value = '') =>
  String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())

export const clampImageZoom = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  return Math.min(Math.max(n, 1), 2.5)
}

export const getProductImages = (product) =>
  Array.isArray(product?.images) ? product.images.filter(Boolean) : []

export const getDisplayCategory = (category) => String(category || 'Attar').trim() || 'Attar'

export const getMinPack = (packs = []) => {
  const normalized = packs
    .map((pack) => {
      const price = Number(pack.price)
      const salePrice =
        pack.salePrice === null || pack.salePrice === undefined || pack.salePrice === ''
          ? null
          : Number(pack.salePrice)
      const onSale = Number.isFinite(salePrice) && salePrice > 0 && Number.isFinite(price) && salePrice < price
      return {
        ...pack,
        label: String(pack.label || '').trim(),
        price,
        salePrice: onSale ? salePrice : null,
        effectivePrice: onSale ? salePrice : price,
        onSale,
      }
    })
    .filter((pack) => pack.label && !Number.isNaN(pack.effectivePrice))

  if (!normalized.length) return null
  return normalized.reduce((min, pack) => (pack.effectivePrice < min.effectivePrice ? pack : min), normalized[0])
}

export const getPriceMeta = (product, packLabel = '') => {
  const packs = Array.isArray(product?.packs) ? product.packs : []
  const normalized = packs.map((pack) => {
    const price = Number(pack.price)
    const salePrice =
      pack.salePrice === null || pack.salePrice === undefined || pack.salePrice === ''
        ? null
        : Number(pack.salePrice)
    const onSale = Number.isFinite(salePrice) && salePrice > 0 && Number.isFinite(price) && salePrice < price
    return {
      ...pack,
      label: String(pack.label || '').trim(),
      price,
      salePrice: onSale ? salePrice : null,
      effectivePrice: onSale ? salePrice : price,
      onSale,
    }
  })

  const selected =
    normalized.find((pack) => pack.label && pack.label === packLabel) ||
    getMinPack(normalized) || {
      label: '',
      price: Number(product?.price || 0),
      salePrice: null,
      effectivePrice: Number(product?.price || 0),
      onSale: false,
    }

  return selected
}

export const getShortDescription = (text, maxLength = 140) => {
  const value = String(text || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!value) return ''
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength).trim()}...`
}

export const getAvailableSizesText = (product) => {
  const custom = String(product?.availableSizesText || '').trim()
  if (custom) return custom

  const packs = (Array.isArray(product?.packs) ? product.packs : [])
    .map((pack) => String(pack?.label || '').trim())
    .filter(Boolean)

  if (!packs.length) return ''
  return packs.join(' | ')
}

export const getRatingMeta = (product) => {
  const rating = Number(product?.rating || 0)
  const count = Number(product?.numReviews || 0)
  return {
    value: Number.isFinite(rating) ? rating : 0,
    count: Number.isFinite(count) ? count : 0,
  }
}

export const getBadgeList = (product) => {
  const badges = []
  if (product?.isBestSeller) badges.push('Bestseller')
  if (product?.isNewArrival) badges.push('New')
  if (product?.sample?.enabled) badges.push('Pure')
  if (!badges.length) badges.push('Premium')
  return badges.slice(0, 3)
}

export const getTrustBadges = (product) => {
  const badges = ['Made in Kannauj', '100% Pure Essence']
  const purposes = Array.isArray(product?.purposeTags) ? product.purposeTags : []
  if (purposes.includes('luxury_gifting') || purposes.includes('weddings')) {
    badges.push('Gift Packaging')
  }
  return badges
}

export const getCategoryFallbackLine = (category) => {
  const key = String(category || 'attar').trim().toLowerCase()
  return CATEGORY_FALLBACKS[key] || ['Refined', 'Pure', 'Traditional']
}

export const getFragranceDescriptors = (product, familyMap = {}) => {
  const labels = (Array.isArray(product?.familyTags) ? product.familyTags : [])
    .map((id) => familyMap[id] || formatLabel(id))
    .filter(Boolean)
    .slice(0, 3)

  if (labels.length) return labels
  return getCategoryFallbackLine(product?.category)
}

export const getNoteLine = (product, familyMap = {}) => getFragranceDescriptors(product, familyMap).join(' • ')

export const getFragranceNotes = (product, familyMap = {}) => {
  const tags = getFragranceDescriptors(product, familyMap)
    .map((label) => String(label).toLowerCase())
    .map((label) => label.replace(/\s+/g, '_'))

  const profiles = tags.map((tag) => NOTE_LIBRARY[tag] || NOTE_LIBRARY[tag.replace(/_/g, ' ')]).filter(Boolean)
  const source = profiles.length ? profiles : [NOTE_LIBRARY.default]

  const take = (key) => {
    const values = []
    source.forEach((profile) => {
      ;(profile[key] || []).forEach((item) => {
        if (!values.includes(item)) values.push(item)
      })
    })
    return values.slice(0, 2)
  }

  return {
    top: take('top'),
    heart: take('heart'),
    base: take('base'),
  }
}

export const getExperienceCopy = (product, familyMap = {}) => {
  const descriptors = getFragranceDescriptors(product, familyMap)
  const shortDescription = getShortDescription(product?.description, 170)
  return shortDescription || `${product?.name || 'This fragrance'} opens with ${descriptors.join(', ').toLowerCase()}, then settles into a smooth trail that feels polished, calm, and unmistakably crafted.`
}

export const getCraftedCopy = (product) =>
  `${BUSINESS.fullDisplayName} shapes ${product?.name || 'each fragrance'} in Kannauj with a slow-made mindset - honoring traditional Deg-Bhapka inspiration, careful blending, and the quiet depth that defines heritage perfumery.`

export const getOccasionHighlights = (product, purposeMap = {}) => {
  const purposes = (Array.isArray(product?.purposeTags) ? product.purposeTags : [])
    .map((id) => purposeMap[id] || PURPOSE_COPY[id] || formatLabel(id))
    .filter(Boolean)
  return purposes.slice(0, 3)
}

export const getHowToUseItems = (product) => {
  const category = getDisplayCategory(product?.category).toLowerCase()
  if (category.includes('rose water')) {
    return [
      'Use on clean skin as a refreshing floral mist or toner.',
      'Store away from direct sunlight to keep the aroma delicate and crisp.',
      'For gifting or ritual use, chill lightly before application for a calmer feel.',
    ]
  }
  if (category.includes('oil')) {
    return [
      'Use a small amount - a few drops or dabs are often enough.',
      'Blend or apply according to intended skin, ritual, or formulation use.',
      'Keep the bottle closed tightly to preserve aromatic purity and depth.',
    ]
  }
  return [
    'Apply lightly on pulse points, fabric accents, or personal ritual spaces.',
    'Layer slowly - oil-based fragrance develops best in small, intentional amounts.',
    'Keep away from direct heat so the character stays rounded and true.',
  ]
}

export const getPurityItems = (product) => {
  const items = ['Crafted in Kannauj', 'Balanced aromatic character', 'Premium batch-led finish']
  if (String(product?.category || '').toLowerCase().includes('rose water')) {
    items.push('Distilled floral water profile')
  } else if (String(product?.category || '').toLowerCase().includes('oil')) {
    items.push('Concentrated aromatic oil expression')
  } else {
    items.push('Attar-style richness and longevity')
  }
  return items.slice(0, 4)
}

export const getShippingReturnItems = (product) => [
  `${product?.name || 'This product'} is packed with care and dispatched with order updates shared by WhatsApp and email.`,
  'If a bottle arrives damaged or an order issue needs review, contact us promptly with your order ID for support.',
  'Bulk, gifting, or custom requirements can be guided directly by the Kannauj Attars team before dispatch.',
]

export const getSearchSuggestions = (products, keyword) => {
  const query = String(keyword || '').trim().toLowerCase()
  if (!query) return []

  return (Array.isArray(products) ? products : [])
    .filter((product) => {
      const haystack = `${product?.name || ''} ${product?.category || ''} ${(product?.familyTags || []).join(' ')}`.toLowerCase()
      return haystack.includes(query)
    })
    .slice(0, 6)
}
