import { DIRECTION_TAGS, GENDER_TAGS, SEASON_TAGS } from '../config/taxonomy'

export const SORT_MAP = {
  popular: 'rating_desc',
  price_asc: 'price_asc',
  price_desc: 'price_desc',
  new_arrivals: 'newest',
}

export const SORT_OPTIONS = [
  { id: 'popular', label: 'Popular' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'new_arrivals', label: 'New Arrivals' },
]

export const CATEGORY_DEFAULTS = ['Attar', 'Perfume', 'Rose Water', 'Essential Oil']
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
  if (value === 'newest') return 'new_arrivals'
  return 'popular'
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

export const readListParam = (searchParams, key, allowedIds) => {
  const raw = (searchParams.get(key) || '').trim()
  if (!raw) return []
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter((id) => allowedIds.has(id))
}

export const countActiveFilters = ({
  selectedCategory = '',
  minPrice = '',
  maxPrice = '',
  selectedFamilies = [],
  selectedSeasons = [],
  selectedGenders = [],
  selectedDirections = [],
  selectedOccasions = [],
  bestSellerOnly = false,
}) =>
  Number(Boolean(selectedCategory)) +
  Number(Boolean(minPrice)) +
  Number(Boolean(maxPrice)) +
  selectedFamilies.length +
  selectedSeasons.length +
  selectedGenders.length +
  selectedDirections.length +
  selectedOccasions.length +
  Number(bestSellerOnly)
