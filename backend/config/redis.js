const path = require('path')
const dotenv = require('dotenv')
const Redis = require('ioredis')

dotenv.config()
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const rawRedisUrl = String(process.env.REDIS_URL || '').trim()
const redisUrl =
  rawRedisUrl.startsWith('redis://') && rawRedisUrl.includes('.upstash.io')
    ? rawRedisUrl.replace(/^redis:\/\//, 'rediss://')
    : rawRedisUrl

let redis = null

if (!redisUrl) {
  console.warn('[redis] REDIS_URL is not set. Redis cache disabled; falling back to MongoDB/in-memory cache.')
} else {
  if (redisUrl !== rawRedisUrl) {
    console.warn('[redis] Upstash URL detected with redis://. Automatically switching to rediss:// for TLS.')
  }

  redis = new Redis(redisUrl, {
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
    connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 10000),
    retryStrategy(attempt) {
      return Math.min(attempt * 200, 2000)
    },
  })

  redis.on('connect', () => {
    console.log('[redis] connection established')
  })

  redis.on('ready', () => {
    console.log('[redis] client ready')
  })

  redis.on('error', (error) => {
    console.error(`[redis] ${error?.message || 'Unknown Redis error'}`)
  })

  redis.on('close', () => {
    console.warn('[redis] connection closed')
  })

  redis.on('reconnecting', () => {
    console.warn('[redis] reconnecting')
  })

  redis.connect().catch((error) => {
    console.error(`[redis] initial connection failed: ${error?.message || 'Unknown Redis error'}`)
  })
}

const getRedisClient = () => redis

module.exports = {
  redis,
  getRedisClient,
}
