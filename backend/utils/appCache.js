const { getRedisClient } = require('../config/redis')

const store = new Map()

const now = () => Date.now()

const normalizeTtlMs = (ttlMs) => Math.max(1000, Number(ttlMs) || 1000)
const normalizeTtlSeconds = (ttlMs) => Math.max(1, Math.ceil(normalizeTtlMs(ttlMs) / 1000))

const logRedisCacheError = (action, key, error) => {
  const message = error?.message || 'Unknown Redis cache error'
  console.error(`[cache] Redis ${action} failed for "${key}": ${message}`)
}

const purgeExpired = () => {
  const current = now()
  for (const [key, entry] of store.entries()) {
    if (!entry || entry.expiresAt <= current) {
      store.delete(key)
    }
  }
}

const getMemoryCache = (key) => {
  const entry = store.get(key)
  if (!entry) return null
  if (entry.expiresAt <= now()) {
    store.delete(key)
    return null
  }
  return entry.value
}

const setMemoryCache = (key, value, ttlMs) => {
  purgeExpired()
  const ttl = normalizeTtlMs(ttlMs)
  store.set(key, {
    value,
    expiresAt: now() + ttl,
  })
  return value
}

const deleteMemoryCache = (key) => {
  store.delete(key)
}

const clearMemoryCacheByPrefix = (prefix) => {
  if (!prefix) return
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key)
    }
  }
}

const getCache = async (key) => {
  if (!key) return null

  const redis = getRedisClient()
  if (!redis) {
    return getMemoryCache(key)
  }

  try {
    const cached = await redis.get(key)
    if (!cached) return null
    return JSON.parse(cached)
  } catch (error) {
    logRedisCacheError('read', key, error)
    return null
  }
}

const setCache = async (key, value, ttlMs) => {
  if (!key) return value

  const redis = getRedisClient()
  if (!redis) {
    setMemoryCache(key, value, ttlMs)
    return value
  }

  try {
    await redis.set(key, JSON.stringify(value), 'EX', normalizeTtlSeconds(ttlMs))
  } catch (error) {
    logRedisCacheError('write', key, error)
  }

  return value
}

const deleteCache = async (key) => {
  if (!key) return

  deleteMemoryCache(key)

  const redis = getRedisClient()
  if (!redis) return

  try {
    await redis.del(key)
  } catch (error) {
    logRedisCacheError('delete', key, error)
  }
}

const clearCacheByPrefix = async (prefix) => {
  if (!prefix) return

  clearMemoryCacheByPrefix(prefix)

  const redis = getRedisClient()
  if (!redis) return

  try {
    let cursor = '0'
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100)
      cursor = nextCursor
      if (Array.isArray(keys) && keys.length > 0) {
        await redis.del(...keys)
      }
    } while (cursor !== '0')
  } catch (error) {
    logRedisCacheError('clear by prefix', prefix, error)
  }
}

module.exports = {
  getCache,
  setCache,
  deleteCache,
  clearCacheByPrefix,
}
