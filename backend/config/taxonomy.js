const slugifyTerm = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')

const DEFAULT_TAXONOMY_TERMS = [
  { group: 'purpose', slug: 'daily_wear', label: 'For Daily Wear', sortOrder: 10 },
  { group: 'purpose', slug: 'weddings', label: 'For Weddings or Parties', sortOrder: 20 },
  { group: 'purpose', slug: 'meditation_spiritual', label: 'For Meditation & Spiritual', sortOrder: 30 },
  { group: 'purpose', slug: 'luxury_gifting', label: 'For Luxury Gifting', sortOrder: 40 },
  { group: 'purpose', slug: 'skin_hair', label: 'For Skin & Hair', sortOrder: 50 },
  { group: 'purpose', slug: 'candle_making', label: 'For Candle Making', sortOrder: 60 },
  { group: 'purpose', slug: 'soap_cosmetic_mfg', label: 'For Soap / Cosmetic Manufacturing', sortOrder: 70 },
  { group: 'purpose', slug: 'industrial_use', label: 'For Industrial Use', sortOrder: 80 },

  { group: 'family', slug: 'floral', label: 'Floral', sortOrder: 10 },
  { group: 'family', slug: 'woody', label: 'Woody', sortOrder: 20 },
  { group: 'family', slug: 'musky', label: 'Musky', sortOrder: 30 },
  { group: 'family', slug: 'oriental', label: 'Oriental', sortOrder: 40 },
  { group: 'family', slug: 'citrus', label: 'Citrus', sortOrder: 50 },
  { group: 'family', slug: 'aquatic', label: 'Aquatic', sortOrder: 60 },
  { group: 'family', slug: 'spicy', label: 'Spicy', sortOrder: 70 },
  { group: 'family', slug: 'gourmand', label: 'Gourmand', sortOrder: 80 },

  { group: 'season', slug: 'summer', label: 'Summer', sortOrder: 10 },
  { group: 'season', slug: 'winter', label: 'Winter', sortOrder: 20 },
  { group: 'season', slug: 'monsoon', label: 'Monsoon', sortOrder: 30 },
  { group: 'season', slug: 'all_season', label: 'All Season', sortOrder: 40 },

  { group: 'gender', slug: 'men', label: 'Men', sortOrder: 10 },
  { group: 'gender', slug: 'women', label: 'Women', sortOrder: 20 },
  { group: 'gender', slug: 'unisex', label: 'Unisex', sortOrder: 30 },

  { group: 'direction', slug: 'arabic_oriental', label: 'Arabic (Oriental)', sortOrder: 10 },
  { group: 'direction', slug: 'fresh_and_aquatics', label: 'Fresh & Aquatics', sortOrder: 20 },
  { group: 'direction', slug: 'fruity', label: 'Fruity', sortOrder: 30 },
  { group: 'direction', slug: 'leathery', label: 'Leathery', sortOrder: 40 },
  { group: 'direction', slug: 'musky', label: 'Musky', sortOrder: 50 },
  { group: 'direction', slug: 'oud', label: 'Oud', sortOrder: 60 },
  { group: 'direction', slug: 'floral', label: 'Floral', sortOrder: 70 },
  { group: 'direction', slug: 'spicy', label: 'Spicy', sortOrder: 80 },
  { group: 'direction', slug: 'sweet_and_gourmand', label: 'Sweet & Gourmand', sortOrder: 90 },
  { group: 'direction', slug: 'powdery', label: 'Powdery', sortOrder: 100 },
  { group: 'direction', slug: 'traditional', label: 'Traditional', sortOrder: 110 },
  { group: 'direction', slug: 'patchouli', label: 'Patchouli', sortOrder: 120 },
  { group: 'direction', slug: 'smoky', label: 'Smoky', sortOrder: 130 },
  { group: 'direction', slug: 'vanilla', label: 'Vanilla', sortOrder: 140 },
  { group: 'direction', slug: 'woody', label: 'Woody', sortOrder: 150 },

  { group: 'collection', slug: 'signature', label: 'Signature Attars', sortOrder: 10 },
  { group: 'collection', slug: 'heritage', label: 'Heritage Collection', sortOrder: 20 },
]

module.exports = { DEFAULT_TAXONOMY_TERMS, slugifyTerm }
