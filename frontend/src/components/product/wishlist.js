const STORAGE_KEY = 'ka:wishlist:v1'

const readWishlist = () => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeWishlist = (items) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new CustomEvent('wishlistchange', { detail: items }))
}

export const wishlistStorage = {
  key: STORAGE_KEY,
  read: readWishlist,
  has(productId) {
    return readWishlist().includes(String(productId || ''))
  },
  toggle(productId) {
    const id = String(productId || '')
    if (!id) return []
    const items = readWishlist()
    const next = items.includes(id) ? items.filter((item) => item !== id) : [id, ...items]
    writeWishlist(next)
    return next
  },
}
