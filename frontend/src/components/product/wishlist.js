const STORAGE_KEY = 'ka:wishlist:v1'

const normalizeWishlist = (items) =>
  [...new Set((Array.isArray(items) ? items : []).map((item) => String(item || '').trim()).filter(Boolean))]

const readWishlist = () => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return normalizeWishlist(parsed)
  } catch {
    return []
  }
}

const writeWishlist = (items) => {
  if (typeof window === 'undefined') return
  const next = normalizeWishlist(items)
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('wishlistchange', { detail: next }))
}

export const wishlistStorage = {
  key: STORAGE_KEY,
  read: readWishlist,
  set(items) {
    writeWishlist(items)
    return readWishlist()
  },
  has(productId) {
    return readWishlist().includes(String(productId || ''))
  },
  add(productId) {
    const id = String(productId || '')
    if (!id) return readWishlist()
    const next = [id, ...readWishlist()]
    writeWishlist(next)
    return readWishlist()
  },
  remove(productId) {
    const id = String(productId || '')
    if (!id) return readWishlist()
    const next = readWishlist().filter((item) => item !== id)
    writeWishlist(next)
    return next
  },
  toggle(productId) {
    const id = String(productId || '')
    if (!id) return []
    const items = readWishlist()
    const next = items.includes(id) ? items.filter((item) => item !== id) : [id, ...items]
    writeWishlist(next)
    return next
  },
  clear() {
    writeWishlist([])
    return []
  },
}
