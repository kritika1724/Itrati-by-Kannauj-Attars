const mongoose = require('mongoose')

const memberSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    addressLine1: { type: String, default: '', trim: true },
    city: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    tags: { type: [String], default: ['Fragrance Club Member'] },
    memberStatus: {
      type: String,
      enum: ['member', 'paused'],
      default: 'member',
    },
    couponCode: { type: String, default: '' },
    discountPercent: { type: Number, default: 0 },
    source: { type: String, default: 'add-to-cart' },
    rewardUnlockedAt: { type: Date, default: Date.now },
    lastCartActivityAt: { type: Date, default: Date.now },
    cartValue: { type: Number, default: 0 },
    cartItems: { type: [String], default: [] },
    campaignPreferences: {
      abandonedCartReminders: { type: Boolean, default: true },
      launchAnnouncements: { type: Boolean, default: true },
      seasonalOffers: { type: Boolean, default: true },
      birthdayCoupons: { type: Boolean, default: true },
    },
    normalizedMobile: { type: String, default: '', trim: true },
  },
  { timestamps: true }
)

memberSchema.pre('validate', function normalizeFields(next) {
  this.fullName = String(this.fullName || '').trim()
  this.mobileNumber = String(this.mobileNumber || '').trim()
  this.email = String(this.email || '').trim().toLowerCase()
  this.addressLine1 = String(this.addressLine1 || '').trim()
  this.city = String(this.city || '').trim()
  this.state = String(this.state || '').trim()
  this.normalizedMobile = String(this.mobileNumber || '').replace(/\D/g, '').slice(-10)
  this.tags = [...new Set((Array.isArray(this.tags) ? this.tags : []).map((tag) => String(tag || '').trim()).filter(Boolean))]
  if (!this.tags.length) this.tags = ['Fragrance Club Member']
  next()
})

memberSchema.index(
  { normalizedMobile: 1 },
  {
    unique: true,
    partialFilterExpression: { normalizedMobile: { $type: 'string', $gt: '' } },
  }
)
memberSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: 'string', $gt: '' } },
  }
)
memberSchema.index({ memberStatus: 1, createdAt: -1 })
memberSchema.index({ lastCartActivityAt: -1 })

module.exports = mongoose.model('FragranceClubMember', memberSchema)
