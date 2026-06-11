import { DIRECTION_TAGS, GENDER_TAGS, SEASON_TAGS } from '../config/taxonomy'

export const SORT_MAP = {
  latest: 'latest',
  popularity: 'popularity',
  price_asc: 'price_asc',
  price_desc: 'price_desc',
  popular: 'popularity',
  new_arrivals: 'latest',
}

export const SORT_OPTIONS = [
  { id: 'latest', label: 'Latest' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'popularity', label: 'Popularity' },
]

export const CATEGORY_DEFAULTS = ['Perfume', 'Rose Water', 'Essential Oil']
export const FAMILY_DEFAULTS = [
  { id: 'floral', label: 'Floral' },
  { id: 'woody', label: 'Woody' },
  { id: 'musky', label: 'Musk' },
  { id: 'oudh', label: 'Oudh' },
  { id: 'fresh', label: 'Fresh' },
  { id: 'spicy', label: 'Spicy' },
]
export const OCCASION_DEFAULTS = [
  { id: 'daily_wear', label: 'Daily wear' },
  { id: 'weddings', label: 'Weddings or Parties' },
  { id: 'luxury_gifting', label: 'Gifting' },
  { id: 'festive', label: 'Festive' },
]
export const SEASON_DEFAULTS = SEASON_TAGS
export const GENDER_DEFAULTS = GENDER_TAGS
export const DIRECTION_DEFAULTS = DIRECTION_TAGS

export const COLLECTION_MAP = {
  signature: {
    title: 'Signature Attars',
    lead: 'Admin-curated blends chosen for everyday elegance, balance, and easy wear.',
  },
  heritage: {
    title: 'Heritage Collection',
    lead: 'Admin-curated traditional profiles inspired by classic Kannauj perfumery.',
  },
}

export const toUiSort = (value) => {
  if (value === 'price_asc') return 'price_asc'
  if (value === 'price_desc') return 'price_desc'
  if (['popularity', 'popular', 'rating_desc'].includes(value)) return 'popularity'
  return 'latest'
}

export const buildChoiceList = (defaults = [], items = []) => {
  const merged = [...defaults, ...items.map((item) => ({ id: item.id, label: item.label }))]
  const seen = new Set()
  return merged.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export const buildIdSet = (items = []) => new Set(items.map((item) => item.id))

export const buildSizeChoicesFromProducts = (products = [], selectedSize = '') => {
  const labels = []
  const pushLabel = (value) => {
    const label = String(value || '').trim()
    if (label) labels.push(label)
  }

  pushLabel(selectedSize)
  products.forEach((product) => {
    ;(Array.isArray(product?.packs) ? product.packs : []).forEach((pack) => pushLabel(pack?.label))
    String(product?.availableSizesText || '')
      .split(/[|,]/)
      .map((item) => item.trim())
      .filter((item) => /\d/.test(item) && item.length <= 32)
      .forEach(pushLabel)
  })

  const seen = new Set()
  return labels
    .filter((label) => {
      const key = label.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .map((label) => ({ id: label, label }))
}

export const readListParam = (searchParams, key, allowedIds) => {
  const raw = (searchParams.get(key) || '').trim()
  if (!raw) return []
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((id) => allowedIds.has(id))
}

export const readFirstListParam = (searchParams, keys = [], allowedIds) => {
  const key = keys.find((item) => (searchParams.get(item) || '').trim())
  return key ? readListParam(searchParams, key, allowedIds) : []
}

export const countActiveFilters = ({
  keyword = '',
  selectedCategory = '',
  minPrice = '',
  maxPrice = '',
  selectedFamilies = [],
  selectedSeasons = [],
  selectedGenders = [],
  selectedDirections = [],
  selectedOccasions = [],
  selectedSize = '',
  bestSellerOnly = false,
}) =>
  Number(Boolean(String(keyword || '').trim())) +
  Number(Boolean(selectedCategory)) +
  Number(Boolean(minPrice)) +
  Number(Boolean(maxPrice)) +
  selectedFamilies.length +
  selectedSeasons.length +
  selectedGenders.length +
  selectedDirections.length +
  selectedOccasions.length +
  Number(Boolean(selectedSize)) +
  Number(bestSellerOnly)
