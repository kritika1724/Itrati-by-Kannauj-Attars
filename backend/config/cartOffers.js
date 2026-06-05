const WELCOME_COUPON_CODE = String(process.env.WELCOME_COUPON_CODE || 'WELCOME5').trim().toUpperCase()
const WELCOME_COUPON_PERCENT = Math.max(0, Number(process.env.WELCOME_COUPON_PERCENT || 5))

const roundCurrency = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100

const getWelcomeDiscount = (couponCode, subtotal) => {
  const normalizedCode = String(couponCode || '').trim().toUpperCase()
  const normalizedSubtotal = Math.max(0, Number(subtotal || 0))

  if (!normalizedCode || normalizedCode !== WELCOME_COUPON_CODE || WELCOME_COUPON_PERCENT <= 0) {
    return {
      discountCode: '',
      discountPercent: 0,
      discountAmount: 0,
    }
  }

  return {
    discountCode: WELCOME_COUPON_CODE,
    discountPercent: WELCOME_COUPON_PERCENT,
    discountAmount: roundCurrency((normalizedSubtotal * WELCOME_COUPON_PERCENT) / 100),
  }
}

module.exports = {
  WELCOME_COUPON_CODE,
  WELCOME_COUPON_PERCENT,
  getWelcomeDiscount,
}
