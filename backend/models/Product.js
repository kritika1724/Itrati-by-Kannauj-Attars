const mongoose = require('mongoose')

const reviewSchema = require('./Review')

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: '' },
    category: { type: String, default: 'Attar' },
    // B2C / B2B segmentation (backward compatible: default personal)
    buyerType: {
      type: String,
      enum: ['personal', 'industrial', 'both'],
      default: 'personal',
    },
    // Smart discovery tags (store ids/slugs, e.g. "daily_wear", "floral")
    purposeTags: { type: [String], default: [] },
    familyTags: { type: [String], default: [] },
    seasonTags: { type: [String], default: [] },
    genderTags: { type: [String], default: [] },
    directionTags: { type: [String], default: [] },
    featuredCollections: { type: [String], default: [] },
    // Curated on Explore/Home by admin (manual best-seller list)
    isBestSeller: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    sample: {
      enabled: { type: Boolean, default: false },
      label: { type: String, default: '' },
      price: { type: Number, default: 0 },
    },
    availableSizesText: { type: String, default: '' },
    price: { type: Number, required: true },
    packs: {
      type: [
        {
          label: { type: String, required: true }, // e.g. "200 gm", "1 kg", "10 kg"
          price: { type: Number, required: true },
          salePrice: { type: Number, default: null },
        },
      ],
      default: [],
    },
    images: { type: [String], default: [] },
    imageZoom: { type: Number, default: 1, min: 1, max: 2.5 },
    highlights: { type: [String], default: [] },
    fragranceNotes: {
      top: { type: [String], default: [] },
      heart: { type: [String], default: [] },
      base: { type: [String], default: [] },
    },
    detailSections: {
      type: [
        {
          title: { type: String, required: true },
          content: { type: String, required: true },
        },
      ],
      default: [],
    },
    relatedProducts: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
      default: [],
    },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    reviews: { type: [reviewSchema], default: [] },
  },
  { timestamps: true }
)

productSchema.index({ category: 1, createdAt: -1 })
productSchema.index({ buyerType: 1, createdAt: -1 })
productSchema.index({ isBestSeller: 1, createdAt: -1 })
productSchema.index({ isNewArrival: 1, createdAt: -1 })
productSchema.index({ 'sample.enabled': 1 })
productSchema.index({ price: 1 })
productSchema.index({ rating: -1 })
productSchema.index({ purposeTags: 1 })
productSchema.index({ familyTags: 1 })
productSchema.index({ seasonTags: 1 })
productSchema.index({ genderTags: 1 })
productSchema.index({ directionTags: 1 })
productSchema.index({ featuredCollections: 1 })
productSchema.index({ 'packs.label': 1 })
productSchema.index({ relatedProducts: 1 })

module.exports = mongoose.model('Product', productSchema)
