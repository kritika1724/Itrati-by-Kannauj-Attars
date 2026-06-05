import { createSlice } from '@reduxjs/toolkit'
import { saveCartForUser } from '../utils/cartStorage'
import { WELCOME_COUPON_CODE, WELCOME_COUPON_PERCENT } from '../utils/cartOffers'

export const DEFAULT_SHIPPING = {
  fullName: '',
  email: '',
  phone: '',
  whatsapp: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
}

export const DEFAULT_CART_STATE = {
  ownerId: 'guest',
  items: [],
  shippingAddress: DEFAULT_SHIPPING,
  paymentMethod: 'COD',
  coupon: {
    code: '',
    discountPercent: 0,
    applied: false,
    source: '',
  },
}

const saveCart = (state) => {
  saveCartForUser(state.ownerId, {
    items: state.items,
    shippingAddress: state.shippingAddress,
    paymentMethod: state.paymentMethod,
    coupon: state.coupon,
  })
}

const sameCartItem = (a, b) =>
  a.product === b.product &&
  (a.packLabel || '') === (b.packLabel || '') &&
  (a.isSample === true) === (b.isSample === true)

const initial = DEFAULT_CART_STATE

const cartSlice = createSlice({
  name: 'cart',
  initialState: initial,
  reducers: {
    hydrateCart(state, action) {
      const { ownerId, items, shippingAddress, paymentMethod, coupon } = action.payload || {}
      state.ownerId = ownerId || 'guest'
      state.items = Array.isArray(items) ? items : []
      state.shippingAddress = { ...DEFAULT_SHIPPING, ...(shippingAddress || {}) }
      state.paymentMethod = paymentMethod || 'COD'
      state.coupon = { ...DEFAULT_CART_STATE.coupon, ...(coupon || {}) }
      // Don’t save on hydrate; it’s a read path.
    },
    addToCart(state, action) {
      const item = action.payload
      const existing = state.items.find((x) => sameCartItem(x, item))
      if (existing) {
        existing.qty = Math.min(existing.qty + item.qty, 99)
      } else {
        state.items.push(item)
      }
      saveCart(state)
    },
    updateQty(state, action) {
      const { product, qty, packLabel = '', isSample = false } = action.payload
      const existing = state.items.find(
        (x) =>
          x.product === product &&
          (x.packLabel || '') === packLabel &&
          (x.isSample === true) === (isSample === true)
      )
      if (existing) {
        existing.qty = Math.max(1, Math.min(Number(qty || 1), 99))
      }
      saveCart(state)
    },
    removeFromCart(state, action) {
      const { product, packLabel = '', isSample = false } = action.payload || {}
      // Backward-compatible: if a string id is passed, remove all packs for that product.
      if (typeof action.payload === 'string') {
        state.items = state.items.filter((x) => x.product !== action.payload)
      } else {
        state.items = state.items.filter(
          (x) =>
            !(
              x.product === product &&
              (x.packLabel || '') === packLabel &&
              (x.isSample === true) === (isSample === true)
            )
        )
      }
      saveCart(state)
    },
    clearCart(state) {
      state.items = []
      state.coupon = { ...DEFAULT_CART_STATE.coupon }
      saveCart(state)
    },
    saveShippingAddress(state, action) {
      state.shippingAddress = { ...state.shippingAddress, ...action.payload }
      saveCart(state)
    },
    savePaymentMethod(state, action) {
      state.paymentMethod = action.payload || 'COD'
      saveCart(state)
    },
    unlockLeadCoupon(state, action) {
      const payload = action.payload || {}
      const phone = String(payload.phone || '').trim()
      state.shippingAddress = {
        ...state.shippingAddress,
        fullName: String(payload.fullName || state.shippingAddress.fullName || '').trim(),
        email: String(payload.email || state.shippingAddress.email || '').trim(),
        phone: phone || state.shippingAddress.phone,
        whatsapp: phone || state.shippingAddress.whatsapp,
        addressLine1: String(payload.addressLine1 || state.shippingAddress.addressLine1 || '').trim(),
        city: String(payload.city || state.shippingAddress.city || '').trim(),
        state: String(payload.state || state.shippingAddress.state || '').trim(),
      }
      state.coupon = {
        code: WELCOME_COUPON_CODE,
        discountPercent: WELCOME_COUPON_PERCENT,
        applied: true,
        source: 'lead-capture',
      }
      saveCart(state)
    },
  },
})

export const {
  addToCart,
  updateQty,
  removeFromCart,
  clearCart,
  saveShippingAddress,
  savePaymentMethod,
  hydrateCart,
  unlockLeadCoupon,
} = cartSlice.actions

export default cartSlice.reducer
