const mongoose = require('mongoose')

const galleryPhotoSchema = new mongoose.Schema(
  {
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GallerySection',
      required: false,
      default: null,
      index: true,
    },
    url: { type: String, required: true, trim: true },
    kind: { type: String, enum: ['image', 'video'], default: 'image' },
    caption: { type: String, default: '', trim: true, maxlength: 120 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

galleryPhotoSchema.index({ section: 1, order: 1, createdAt: 1 })

module.exports = mongoose.model('GalleryPhoto', galleryPhotoSchema)
