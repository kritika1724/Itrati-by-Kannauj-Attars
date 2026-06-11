const mongoose = require('mongoose')
const crypto = require('crypto')

const createPublicOrderId = () =>
  `KA-${Date.now().toString(36).slice(-6).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    image: { type: String, default: '' },
    sample: { type: Boolean, default: false },
    pack: {
      label: { type: String, default: '' },
    },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    orderItems: { type: [orderItemSchema], required: true, default: [] },
    shippingAddress: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      whatsapp: { type: String, default: '' },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String, default: '' },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true, default: 'India' },
    },
    publicOrderId: { type: String, default: '' },
    paymentMethod: { type: String, required: true, default: 'COD' },
    itemsPrice: { type: Number, required: true },
    shippingPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    discountCode: { type: String, default: '' },
    discountPercent: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    totalPrice: { type: Number, required: true },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
    status: {
      type: String,
      enum: ['payment_pending', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    cancelledAt: { type: Date },
    paymentResult: {
      provider: { type: String, default: '' }, // e.g. "razorpay"
      id: { type: String },
      status: { type: String },
      email: { type: String },
      method: { type: String },
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      razorpaySignature: { type: String },
      webhookEventId: { type: String },
      amount: { type: Number },
      currency: { type: String },
      errorCode: { type: String },
      errorDescription: { type: String },
    },
  },
  { timestamps: true }
)

orderSchema.pre('validate', function ensurePublicOrderId(next) {
  if (!this.publicOrderId) {
    this.publicOrderId = createPublicOrderId()
  }
  if (!this.shippingAddress?.whatsapp) {
    this.shippingAddress = {
      ...(this.shippingAddress || {}),
      whatsapp: '',
    }
  }
  next()
})

orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ status: 1, createdAt: -1 })
orderSchema.index({ createdAt: -1 })
orderSchema.index(
  { publicOrderId: 1 },
  {
    unique: true,
    partialFilterExpression: { publicOrderId: { $type: 'string', $gt: '' } },
  }
)
orderSchema.index({ 'shippingAddress.email': 1, createdAt: -1 })
orderSchema.index({ 'shippingAddress.whatsapp': 1, createdAt: -1 })

module.exports = mongoose.model('Order', orderSchema)
