const store = new Map()

const now = () => Date.now()

const purgeExpired = () => {
  const current = now()
  for (const [key, entry] of store.entries()) {
    if (!entry || entry.expiresAt <= current) {
      store.delete(key)
    }
  }
}

const getCache = (key) => {
  const entry = store.get(key)
  if (!entry) return null
  if (entry.expiresAt <= now()) {
    store.delete(key)
    return null
  }
  return entry.value
}

const setCache = (key, value, ttlMs) => {
  purgeExpired()
  const ttl = Math.max(1000, Number(ttlMs) || 0)
  store.set(key, {
    value,
    expiresAt: now() + ttl,
  })
  return value
}

const deleteCache = (key) => {
  store.delete(key)
}

const clearCacheByPrefix = (prefix) => {
  if (!prefix) return
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key)
    }
  }
}

module.exports = {
  getCache,
  setCache,
  deleteCache,
  clearCacheByPrefix,
}
