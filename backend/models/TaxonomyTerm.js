const mongoose = require('mongoose')

const taxonomyTermSchema = new mongoose.Schema(
  {
    group: {
      type: String,
      enum: ['purpose', 'family', 'collection'],
      required: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

taxonomyTermSchema.index({ group: 1, slug: 1 }, { unique: true })
taxonomyTermSchema.index({ group: 1, isActive: 1, sortOrder: 1, label: 1 })

module.exports = mongoose.model('TaxonomyTerm', taxonomyTermSchema)
