const mongoose = require('mongoose')

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    channel: {
      type: String,
      enum: ['whatsapp', 'email', 'mixed'],
      default: 'mixed',
    },
    audience: {
      type: String,
      enum: ['all-members', 'launch', 'seasonal', 'birthday', 'abandoned-cart'],
      default: 'all-members',
    },
    couponCode: { type: String, default: '', trim: true, uppercase: true },
    status: {
      type: String,
      enum: ['draft', 'queued', 'sent'],
      default: 'draft',
    },
    scheduledFor: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    targetCount: { type: Number, default: 0 },
    notes: { type: String, default: '', trim: true },
    createdBy: { type: String, default: '', trim: true },
  },
  { timestamps: true }
)

campaignSchema.index({ status: 1, createdAt: -1 })
campaignSchema.index({ audience: 1, createdAt: -1 })

module.exports = mongoose.model('FragranceClubCampaign', campaignSchema)
