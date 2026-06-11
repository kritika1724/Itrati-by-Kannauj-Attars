/* eslint-disable no-console */
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config()
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const Product = require('../models/Product')

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const packTemplates = {
  value: [
    { label: '200 gm', price: 199 },
    { label: '500 gm', price: 449 },
    { label: '1 kg', price: 849 },
    { label: '10 kg', price: 7999 },
  ],
  standard: [
    { label: '200 gm', price: 249 },
    { label: '500 gm', price: 549 },
    { label: '1 kg', price: 999 },
    { label: '10 kg', price: 9499 },
  ],
  premium: [
    { label: '200 gm', price: 349 },
    { label: '500 gm', price: 799 },
    { label: '1 kg', price: 1499 },
    { label: '10 kg', price: 13999 },
  ],
  luxury: [
    { label: '200 gm', price: 499 },
    { label: '500 gm', price: 1199 },
    { label: '1 kg', price: 2199 },
    { label: '10 kg', price: 20999 },
  ],
}

const makeProduct = ({
  name,
  description,
  familyTags,
  purposeTags,
  buyerType = 'personal',
  isBestSeller = false,
  tier = 'standard',
  highlights = [],
}) => {
  const packs = packTemplates[tier] || packTemplates.standard
  const minPrice = packs.reduce((min, p) => (p.price < min ? p.price : min), packs[0].price)
  return {
    name,
    description,
    category: 'Attar',
    buyerType,
    purposeTags,
    familyTags,
    isBestSeller,
    price: minPrice,
    packs,
    images: [],
    highlights,
  }
}

const seedProducts = [
  makeProduct({
    name: 'Ruh Gulab (Rose Attar)',
    description:
      'A classic rose attar with soft petals and a clean, elegant finish. Timeless for daily wear and gifting.',
    familyTags: ['floral'],
    purposeTags: ['daily_wear', 'meditation_spiritual', 'luxury_gifting', 'skin_hair', 'soap_cosmetic_mfg'],
    buyerType: 'both',
    isBestSeller: true,
    tier: 'standard',
    highlights: ['Classic rose heart', 'Smooth, refined wear', 'Popular choice for gifting'],
  }),
  makeProduct({
    name: 'Ruh Jasmine (Jasmine Attar)',
    description:
      'Rich jasmine floral with a creamy, lingering trail. A traditional profile loved in Indian perfumery.',
    familyTags: ['floral'],
    purposeTags: ['daily_wear', 'luxury_gifting', 'skin_hair', 'soap_cosmetic_mfg'],
    buyerType: 'both',
    isBestSeller: true,
    tier: 'premium',
    highlights: ['Intense jasmine bloom', 'Long-lasting floral', 'Festive and elegant'],
  }),
  makeProduct({
    name: 'Kewra Attar',
    description:
      'Fresh, green-floral kewra style with a bright opening and traditional charm.',
    familyTags: ['floral'],
    purposeTags: ['daily_wear', 'meditation_spiritual', 'luxury_gifting', 'soap_cosmetic_mfg'],
    buyerType: 'both',
    tier: 'standard',
    highlights: ['Green-floral freshness', 'Traditional profile', 'Great for layering'],
  }),
  makeProduct({
    name: 'Khus Attar (Vetiver)',
    description:
      'Cooling vetiver depth with an earthy, woody character. Grounding, clean, and quietly luxurious.',
    familyTags: ['woody'],
    purposeTags: ['daily_wear', 'meditation_spiritual', 'luxury_gifting', 'soap_cosmetic_mfg'],
    buyerType: 'both',
    isBestSeller: true,
    tier: 'premium',
    highlights: ['Cooling vetiver', 'Earthy woods', 'A summer favourite'],
  }),
  makeProduct({
    name: 'Sandalwood (Chandan) Attar',
    description:
      'Smooth sandalwood-style warmth with a calm, devotional feel. A staple for spiritual use and premium gifting.',
    familyTags: ['woody'],
    purposeTags: ['meditation_spiritual', 'luxury_gifting', 'daily_wear', 'skin_hair'],
    buyerType: 'both',
    isBestSeller: true,
    tier: 'luxury',
    highlights: ['Woody calm', 'Tradition-inspired', 'Elegant drydown'],
  }),
  makeProduct({
    name: 'Mitti Attar (First Rain)',
    description:
      'An earthy “first rain” profile that feels nostalgic and grounding — like wet soil after monsoon.',
    familyTags: ['woody', 'oriental'],
    purposeTags: ['meditation_spiritual', 'daily_wear', 'luxury_gifting'],
    buyerType: 'personal',
    isBestSeller: true,
    tier: 'standard',
    highlights: ['Earthy petrichor vibe', 'Unique heritage profile', 'Calm and grounding'],
  }),
  makeProduct({
    name: 'Shamama Special',
    description:
      'A complex, traditional blend with warmth, spice, and depth. Festive and bold — made for occasions.',
    familyTags: ['oriental', 'spicy'],
    purposeTags: ['weddings', 'luxury_gifting', 'meditation_spiritual'],
    buyerType: 'personal',
    isBestSeller: true,
    tier: 'luxury',
    highlights: ['Complex traditional blend', 'Warm spicy depth', 'Statement profile'],
  }),
  makeProduct({
    name: 'Majmua (Classic Blend)',
    description:
      'A classic multi-note attar blend with smooth florals and musky warmth. Versatile and crowd-pleasing.',
    familyTags: ['musky', 'oriental'],
    purposeTags: ['daily_wear', 'luxury_gifting', 'weddings'],
    buyerType: 'personal',
    tier: 'standard',
    highlights: ['Balanced blend', 'Everyday elegance', 'Great for gifting'],
  }),
  makeProduct({
    name: 'Amber Attar',
    description:
      'Warm amber comfort with a rich, resinous tone. Ideal for evening wear and premium gifting.',
    familyTags: ['oriental'],
    purposeTags: ['weddings', 'luxury_gifting'],
    buyerType: 'personal',
    tier: 'premium',
    highlights: ['Warm amber tone', 'Evening-friendly', 'Luxurious feel'],
  }),
  makeProduct({
    name: 'White Musk Attar',
    description:
      'Clean musk softness that sits close to skin. Minimal, modern, and easy to wear.',
    familyTags: ['musky'],
    purposeTags: ['daily_wear', 'luxury_gifting'],
    buyerType: 'personal',
    tier: 'standard',
    highlights: ['Clean musk', 'Skin-close softness', 'Modern everyday'],
  }),
  makeProduct({
    name: 'Oud Attar (Woody Oud)',
    description:
      'Deep woody oud-style richness with an oriental character. Crafted for luxury wear and special moments.',
    familyTags: ['woody', 'oriental'],
    purposeTags: ['weddings', 'luxury_gifting'],
    buyerType: 'personal',
    tier: 'luxury',
    highlights: ['Woody depth', 'Luxury profile', 'Night / occasion wear'],
  }),
  makeProduct({
    name: 'Saffron Attar (Zafran)',
    description:
      'Spicy saffron warmth with a refined finish. A festive, premium profile often chosen for weddings.',
    familyTags: ['spicy', 'oriental'],
    purposeTags: ['weddings', 'luxury_gifting', 'meditation_spiritual'],
    buyerType: 'personal',
    tier: 'premium',
    highlights: ['Spicy saffron warmth', 'Premium feel', 'Festive wear'],
  }),
  makeProduct({
    name: 'Hina Attar (Henna)',
    description:
      'Traditional hina-style character with herbal warmth and depth. A heritage profile with cultural roots.',
    familyTags: ['woody', 'spicy'],
    purposeTags: ['meditation_spiritual', 'weddings', 'luxury_gifting'],
    buyerType: 'personal',
    tier: 'premium',
    highlights: ['Herbal warmth', 'Traditional profile', 'Distinct character'],
  }),
  makeProduct({
    name: 'Lavender Attar',
    description:
      'Soft aromatic lavender with a clean, calming feel. Often chosen for daily wear and relaxation routines.',
    familyTags: ['floral'],
    purposeTags: ['daily_wear', 'meditation_spiritual', 'skin_hair', 'candle_making', 'soap_cosmetic_mfg'],
    buyerType: 'both',
    tier: 'standard',
    highlights: ['Calm lavender', 'Clean aromatic', 'Maker-friendly profile'],
  }),
  makeProduct({
    name: 'Patchouli Attar',
    description:
      'Deep patchouli earthiness with a dark, refined edge. Great for evenings and rich compositions.',
    familyTags: ['woody', 'oriental'],
    purposeTags: ['luxury_gifting', 'weddings', 'candle_making', 'soap_cosmetic_mfg'],
    buyerType: 'both',
    tier: 'premium',
    highlights: ['Earthy depth', 'Rich drydown', 'Ideal for blends'],
  }),
  makeProduct({
    name: 'Bergamot Attar',
    description:
      'Bright bergamot freshness with a crisp citrus lift. Clean, modern, and energizing.',
    familyTags: ['citrus'],
    purposeTags: ['daily_wear', 'candle_making', 'soap_cosmetic_mfg'],
    buyerType: 'both',
    tier: 'standard',
    highlights: ['Bright citrus', 'Fresh opening', 'Great for layering'],
  }),
  makeProduct({
    name: 'Citrus Fresh Attar',
    description:
      'A lively fresh profile with citrus sparkle and clean airiness — ideal for hot weather and daily wear.',
    familyTags: ['citrus', 'aquatic'],
    purposeTags: ['daily_wear'],
    buyerType: 'personal',
    tier: 'value',
    highlights: ['Fresh citrus lift', 'Light and clean', 'Easy daily wear'],
  }),
  makeProduct({
    name: 'Mint Cool Attar',
    description:
      'A cool minty freshness with a clean, modern feel. Great for daytime and summer.',
    familyTags: ['aquatic', 'citrus'],
    purposeTags: ['daily_wear', 'meditation_spiritual'],
    buyerType: 'personal',
    tier: 'value',
    highlights: ['Cooling freshness', 'Modern clean vibe', 'Daytime friendly'],
  }),
  makeProduct({
    name: 'Rajnigandha (Tuberose) Attar',
    description:
      'Bold tuberose floral with a creamy, festive presence. A popular choice for weddings and evening wear.',
    familyTags: ['floral'],
    purposeTags: ['weddings', 'luxury_gifting'],
    buyerType: 'personal',
    tier: 'premium',
    highlights: ['Bold white floral', 'Festive wear', 'Premium gifting'],
  }),
  makeProduct({
    name: 'Mogra Attar',
    description:
      'Sweet mogra-style jasmine floral with a soft, romantic feel.',
    familyTags: ['floral'],
    purposeTags: ['daily_wear', 'weddings', 'luxury_gifting'],
    buyerType: 'personal',
    tier: 'standard',
    highlights: ['Sweet floral', 'Romantic vibe', 'Classic and loved'],
  }),
  makeProduct({
    name: 'Bela Attar',
    description:
      'A smooth bela-style floral with gentle sweetness and a refined, clean finish.',
    familyTags: ['floral'],
    purposeTags: ['daily_wear', 'luxury_gifting'],
    buyerType: 'personal',
    tier: 'standard',
    highlights: ['Soft floral', 'Clean wear', 'Elegant for daily use'],
  }),
  makeProduct({
    name: 'Champa Attar',
    description:
      'Warm champa-style floral with traditional depth. Comforting, rich, and memorable.',
    familyTags: ['floral', 'oriental'],
    purposeTags: ['weddings', 'luxury_gifting', 'meditation_spiritual'],
    buyerType: 'personal',
    tier: 'premium',
    highlights: ['Warm floral depth', 'Traditional character', 'Great for evenings'],
  }),
  makeProduct({
    name: 'Nargis Attar',
    description:
      'A refined floral profile with a gentle, elegant character and smooth projection.',
    familyTags: ['floral'],
    purposeTags: ['luxury_gifting', 'daily_wear'],
    buyerType: 'personal',
    tier: 'premium',
    highlights: ['Elegant floral', 'Smooth projection', 'Premium feel'],
  }),
  makeProduct({
    name: 'Loban (Frankincense) Attar',
    description:
      'Resinous frankincense warmth with a sacred, meditative tone. Often chosen for spiritual use.',
    familyTags: ['oriental', 'woody'],
    purposeTags: ['meditation_spiritual', 'luxury_gifting', 'industrial_use'],
    buyerType: 'both',
    tier: 'premium',
    highlights: ['Resinous warmth', 'Meditative vibe', 'Traditional use'],
  }),
  makeProduct({
    name: 'Myrrh Attar',
    description:
      'Deep resinous myrrh character with warm, antique richness and an oriental edge.',
    familyTags: ['oriental', 'woody'],
    purposeTags: ['meditation_spiritual', 'luxury_gifting', 'industrial_use'],
    buyerType: 'both',
    tier: 'premium',
    highlights: ['Resinous depth', 'Warm richness', 'Layering-friendly'],
  }),
  makeProduct({
    name: 'Cedarwood Attar',
    description:
      'Clean cedarwood-style dryness with woody clarity. A modern staple for blends and daily wear.',
    familyTags: ['woody'],
    purposeTags: ['daily_wear', 'meditation_spiritual', 'candle_making', 'soap_cosmetic_mfg', 'industrial_use'],
    buyerType: 'both',
    tier: 'standard',
    highlights: ['Dry woody clarity', 'Great for blending', 'Modern feel'],
  }),
  makeProduct({
    name: 'Rose Oud Blend',
    description:
      'A luxurious blend of rose elegance with oud-style woody depth — crafted for premium evenings.',
    familyTags: ['floral', 'woody', 'oriental'],
    purposeTags: ['weddings', 'luxury_gifting'],
    buyerType: 'personal',
    tier: 'luxury',
    highlights: ['Rose + oud style', 'Luxury evenings', 'Bold and refined'],
  }),
  makeProduct({
    name: 'Amber Musk Blend',
    description:
      'Warm amber comfort fused with clean musk softness. Smooth, modern, and long-wearing.',
    familyTags: ['musky', 'oriental'],
    purposeTags: ['daily_wear', 'weddings', 'luxury_gifting'],
    buyerType: 'personal',
    tier: 'premium',
    highlights: ['Amber warmth', 'Clean musk', 'Versatile profile'],
  }),
  makeProduct({
    name: 'Spicy Oriental Blend',
    description:
      'A festive oriental blend with warm spices and deep character — built for occasions and night wear.',
    familyTags: ['spicy', 'oriental'],
    purposeTags: ['weddings', 'luxury_gifting'],
    buyerType: 'personal',
    tier: 'premium',
    highlights: ['Warm spices', 'Occasion-ready', 'Rich drydown'],
  }),
  makeProduct({
    name: 'Floral Bouquet Blend',
    description:
      'A bright floral blend with smooth sweetness and a clean finish — easy to love and gift-worthy.',
    familyTags: ['floral'],
    purposeTags: ['daily_wear', 'luxury_gifting', 'weddings'],
    buyerType: 'personal',
    tier: 'standard',
    highlights: ['Bright florals', 'Clean finish', 'Gift-worthy'],
  }),
  makeProduct({
    name: 'Jannat-ul-Firdous (Heavenly Blend)',
    description:
      'A popular classic blend with a rich, airy sweetness and a smooth oriental-musky base.',
    familyTags: ['oriental', 'musky'],
    purposeTags: ['daily_wear', 'weddings', 'luxury_gifting'],
    buyerType: 'personal',
    tier: 'premium',
    highlights: ['Popular classic blend', 'Oriental-musky base', 'Versatile wear'],
  }),
  makeProduct({
    name: 'Chandan Gulab (Sandal Rose Blend)',
    description:
      'A timeless blend of rose elegance and sandalwood calm — refined, traditional, and gift-worthy.',
    familyTags: ['floral', 'woody'],
    purposeTags: ['daily_wear', 'luxury_gifting', 'weddings', 'meditation_spiritual'],
    buyerType: 'personal',
    tier: 'premium',
    highlights: ['Rose + sandalwood', 'Traditional elegance', 'Premium gifting'],
  }),
  makeProduct({
    name: 'Khus Gulab (Vetiver Rose Blend)',
    description:
      'Cooling vetiver paired with soft rose — fresh, balanced, and beautifully wearable.',
    familyTags: ['woody', 'floral'],
    purposeTags: ['daily_wear', 'luxury_gifting', 'meditation_spiritual'],
    buyerType: 'personal',
    tier: 'standard',
    highlights: ['Cooling freshness', 'Balanced floral-woody', 'Great for daily wear'],
  }),
  makeProduct({
    name: 'Vanilla Amber Attar',
    description:
      'Smooth vanilla sweetness wrapped in warm amber. A cozy gourmand profile for evenings and gifting.',
    familyTags: ['gourmand', 'oriental'],
    purposeTags: ['luxury_gifting', 'weddings'],
    buyerType: 'personal',
    tier: 'premium',
    highlights: ['Cozy sweetness', 'Warm amber base', 'Evening-friendly'],
  }),
  makeProduct({
    name: 'Aqua Musk Attar',
    description:
      'Fresh aquatic air with clean musk softness — modern, crisp, and easy to wear in heat.',
    familyTags: ['aquatic', 'musky'],
    purposeTags: ['daily_wear'],
    buyerType: 'personal',
    tier: 'value',
    highlights: ['Crisp freshness', 'Clean musk base', 'Hot-weather friendly'],
  }),
]

async function main() {
  const mongo = process.env.MONGO_URI
  if (!mongo) throw new Error('MONGO_URI is required')

  const updateExisting = process.argv.includes('--update')

  await mongoose.connect(mongo)

  let inserted = 0
  let skipped = 0
  let updated = 0

  for (const p of seedProducts) {
    const existing = await Product.findOne({
      name: { $regex: `^${escapeRegex(p.name)}$`, $options: 'i' },
    })

    if (existing) {
      if (updateExisting) {
        await Product.updateOne({ _id: existing._id }, { $set: p })
        updated += 1
      } else {
        skipped += 1
      }
      continue
    }

    await Product.create(p)
    inserted += 1
  }

  console.log('Seed complete.')
  console.log(`Inserted: ${inserted}`)
  console.log(`Updated: ${updated}`)
  console.log(`Skipped: ${skipped}`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e.message || e)
  process.exit(1)
})
