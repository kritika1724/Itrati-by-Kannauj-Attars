export const PURPOSE_COLLECTION_META = {
  daily_wear: {
    title: 'For Daily Wear',
    lead: 'Balanced attars and perfume oils selected for clean, comfortable everyday wear.',
  },
  weddings: {
    title: 'For Weddings or Parties',
    lead: 'Rich floral, festive, and memorable blends suited for weddings, parties, gifting, and celebration.',
  },
  meditation_spiritual: {
    title: 'For Meditation & Spiritual',
    lead: 'Grounding, calm fragrance profiles chosen for ritual use, reflection, and serene spaces.',
  },
  luxury_gifting: {
    title: 'For Luxury Gifting',
    lead: 'Elegant presentation-worthy fragrances curated for premium gifting and special occasions.',
  },
  skin_hair: {
    title: 'For Skin & Hair',
    lead: 'Rose waters, oils, and gentle aromatic options commonly chosen for skin and hair use.',
  },
  candle_making: {
    title: 'For Candle Making',
    lead: 'Fragrance materials and oils suited for candle projects, ambient blends, and artisanal making.',
  },
  soap_cosmetic_mfg: {
    title: 'For Soap / Cosmetic Manufacturing',
    lead: 'Relevant aromatic materials for soaps, personal care products, and cosmetic formulation.',
  },
  industrial_use: {
    title: 'For Industrial Use',
    lead: 'Trade-focused aromatic materials and compounds for larger requirement and manufacturing needs.',
  },
}

export const getPurposeCollectionMeta = (id, fallbackLabel = 'Collection', fallbackLead = '') => {
  const meta = PURPOSE_COLLECTION_META[id] || {
    title: fallbackLabel,
    lead: 'Browse products in this collection.',
  }
  return {
    title: fallbackLabel || meta.title,
    lead: fallbackLead || meta.lead,
  }
}
