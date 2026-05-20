const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
let cookieParser
try {
  cookieParser = require('cookie-parser')
} catch {
  cookieParser = null
}
const connectDB = require('./config/db')
const path = require('path')
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const productRoutes = require('./routes/products')
const uploadRoutes = require('./routes/uploads')
const orderRoutes = require('./routes/orders')
const adminRoutes = require('./routes/admin')
const assetRoutes = require('./routes/assets')
const oauthRoutes = require('./routes/oauth')
const { router: sessionRoutes } = require('./routes/session')
const paymentRoutes = require('./routes/payments')
const contactRoutes = require('./routes/contact')
const galleryRoutes = require('./routes/gallery')
const taxonomyRoutes = require('./routes/taxonomy')
const { ensureDefaultTaxonomy } = require('./utils/taxonomy')

dotenv.config()
// Load env from backend/.env even if server is started from the repo root.
dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
app.set('trust proxy', 1)
app.disable('x-powered-by')
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false, limit: '1mb' }))
if (cookieParser) {
  app.use(cookieParser())
} else {
  // Minimal cookie parser (fallback when deps can't be installed).
  app.use((req, _res, next) => {
    const header = req.headers.cookie || ''
    const out = {}
    header.split(';').forEach((part) => {
      const s = part.trim()
      if (!s) return
      const idx = s.indexOf('=')
      if (idx === -1) return
      const k = s.slice(0, idx).trim()
      const v = s.slice(idx + 1).trim()
      if (!k) return
      try {
        out[k] = decodeURIComponent(v)
      } catch {
        out[k] = v
      }
    })
    req.cookies = out
    next()
  })
}

// Allow frontend (different origin/port) to load images from /uploads.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://res.cloudinary.com',
          'https://*.cloudinary.com',
        ],
        mediaSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://res.cloudinary.com',
          'https://*.cloudinary.com',
        ],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://checkout.razorpay.com'],
        frameSrc: ["'self'", 'https://checkout.razorpay.com', 'https://api.razorpay.com'],
        connectSrc: [
          "'self'",
          'https://checkout.razorpay.com',
          'https://api.razorpay.com',
          'https://api.cloudinary.com',
          'https://res.cloudinary.com',
          'https://*.cloudinary.com',
        ],
      },
    },
  })
)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'))

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
)

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser clients (curl/postman) with no origin.
      if (!origin) return cb(null, true)

      // Explicit allowlist
      if (allowedOrigins.includes(origin)) return cb(null, true)

      // Dev convenience: allow any localhost port so Vite can move 5173 -> 5174, etc.
      if (
        process.env.NODE_ENV !== 'production' &&
        (/^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin))
      ) {
        return cb(null, true)
      }

      return cb(new Error(`CORS blocked for origin: ${origin}`))
    },
    credentials: true,
  })
)

app.get('/api/health', (req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/products', productRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/assets', assetRoutes)
app.use('/api/oauth', oauthRoutes)
app.use('/api/session', sessionRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/contact', contactRoutes)
app.use('/api/gallery', galleryRoutes)
app.use('/api/taxonomy', taxonomyRoutes)

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '30d',
    immutable: true,
  })
)

// Serve the React app in production (single deploy).
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'frontend', 'dist')
  app.use(
    express.static(distPath, {
      etag: true,
      index: false,
      maxAge: '7d',
      setHeaders(res, filePath) {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache')
          return
        }

        if (/\.(js|css|woff2?|png|jpe?g|webp|svg|gif|mp4|webm)$/i.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        }
      },
    })
  )
  app.get('*', (req, res) => {
    // Don’t hijack API or uploads routes
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return res.status(404).json({ message: 'Not found' })
    }
    return res.sendFile(path.join(distPath, 'index.html'))
  })
}

// API 404
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' })
})

app.use((err, req, res, next) => {
  console.error(err)

  if (err?.name === 'ValidationError') {
    return res.status(400).json({ message: err.message || 'Validation failed' })
  }

  if (err?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id or query value' })
  }

  if (err?.code === 11000) {
    return res.status(409).json({ message: 'Duplicate value already exists' })
  }

  if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token invalid' })
  }

  return res.status(err?.statusCode || 500).json({ message: err?.message || 'Server error' })
})

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI)
    await ensureDefaultTaxonomy()

    // Use a fixed port to avoid frontend/backend mismatches.
    const port = Number(process.env.PORT || 5000)
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
    server.keepAliveTimeout = Number(process.env.KEEP_ALIVE_TIMEOUT_MS || 65000)
    server.headersTimeout = Number(process.env.HEADERS_TIMEOUT_MS || 66000)
    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE') {
        console.error(
          `Port ${port} is already in use. Stop the other process or change PORT in backend/.env (e.g. 5002).`
        )
        process.exit(1)
      }
      console.error('Server failed to listen', err)
      process.exit(1)
    })
  } catch (error) {
    console.error('Failed to start server', error)
    process.exit(1)
  }
}

start()
