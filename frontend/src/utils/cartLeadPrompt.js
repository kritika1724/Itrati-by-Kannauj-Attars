export const CART_ITEM_ADDED_EVENT = 'ka:cart-item-added'

export const notifyCartItemAdded = (detail = {}) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CART_ITEM_ADDED_EVENT, { detail }))
}
