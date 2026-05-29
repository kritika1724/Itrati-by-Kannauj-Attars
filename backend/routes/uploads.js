const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const { getCloudinaryConfig, getUploadRuntimeStatus } = require('../config/uploadRuntime')
let sharp
try {
  // Optional dependency (recommended) to convert HEIC/HEIF to JPG/WebP.
  // If not installed, uploads still work for JPG/PNG/WebP.
  sharp = require('sharp')
} catch {
  sharp = null
}
const { protect, adminOnly } = require('../middleware/auth')
const { uploadWriteLimiter } = require('../utils/rateLimit')

const router = express.Router()

const uploadsDir = path.join(__dirname, '..', 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })

const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif']
const VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.m4v', '.ogg']
const HEIC_EXTS = ['.heic', '.heif']

const uploadToCloudinary = async ({ buffer, filename, mimeType }) => {
  const cfg = getCloudinaryConfig()
  if (!cfg) return null
  const resourceType = String(mimeType || '').startsWith('video/') ? 'video' : 'image'

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = String(process.env.CLOUDINARY_FOLDER || 'kannauj-attars').trim()
  const publicId = path.basename(filename, path.extname(filename))

  const signSource = [`folder=${folder}`, `public_id=${publicId}`, `timestamp=${timestamp}`].join('&')
  const signature = crypto
    .createHash('sha1')
    .update(`${signSource}${cfg.apiSecret}`)
    .digest('hex')

  const form = new FormData()
  form.append('file', new Blob([buffer], { type: mimeType || 'application/octet-stream' }), filename)
  form.append('api_key', cfg.apiKey)
  form.append('timestamp', String(timestamp))
  form.append('folder', folder)
  form.append('public_id', publicId)
  form.append('signature', signature)

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/${resourceType}/upload`, {
    method: 'POST',
    body: form,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const msg = data?.error?.message || 'Cloudinary upload failed'
    throw new Error(msg)
  }

  return {
    url: data.secure_url || data.url,
    absoluteUrl: data.secure_url || data.url,
    provider: 'cloudinary',
    publicId: data.public_id || publicId,
  }
}

const saveLocally = ({ buffer, filename, req }) => {
  fs.writeFileSync(path.join(uploadsDir, filename), buffer)

  const relativePath = `/uploads/${filename}`
  const absoluteUrl = `${req.protocol}://${req.get('host')}${relativePath}`

  return {
    url: relativePath,
    absoluteUrl,
    provider: 'local',
  }
}

const resolveUploadKind = (file) => {
  const ext = path.extname(file?.originalname || '').toLowerCase()
  const mimeType = String(file?.mimetype || '').toLowerCase()

  if (mimeType.startsWith('video/') || VIDEO_EXTS.includes(ext)) {
    return 'video'
  }

  if (
    mimeType.startsWith('image/') ||
    IMAGE_EXTS.includes(ext) ||
    HEIC_EXTS.includes(ext) ||
    mimeType === 'application/octet-stream'
  ) {
    return 'image'
  }

  return null
}

const fileFilter = (req, file, cb) => {
  if (resolveUploadKind(file)) {
    cb(null, true)
  } else {
    cb(new Error('Only image or video files are allowed'), false)
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 80 * 1024 * 1024 },
})

router.post('/', protect, adminOnly, uploadWriteLimiter, (req, res) => {
  upload.any()(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload failed' })
    }

    try {
      const file = Array.isArray(req.files) ? req.files[0] : null

      if (!file) return res.status(400).json({ message: 'No file uploaded' })

      const originalExt = path.extname(file.originalname || '').toLowerCase()
      const safeBase =
        path
          .basename(file.originalname || 'file', originalExt)
          .replace(/[^\w\-]+/g, '-')
          .replace(/-+/g, '-')
          .slice(0, 60) || 'image'

      const stamp = Date.now()

      let outExt = originalExt || '.jpg'
      let outBuffer = file.buffer
      const detectedKind = resolveUploadKind(file)
      const isVideo = detectedKind === 'video'

      const isHeic =
        HEIC_EXTS.includes(originalExt) ||
        file.mimetype === 'image/heic' ||
        file.mimetype === 'image/heif'

      // Many browsers don't display HEIC directly. Convert if we can.
      if (isHeic) {
        if (!sharp) {
          return res.status(400).json({
            message:
              'HEIC images are not supported in browsers. Please upload JPG/PNG/WebP, or install sharp on the backend to auto-convert.',
          })
        }
        outExt = '.jpg'
        outBuffer = await sharp(file.buffer).jpeg({ quality: 88 }).toBuffer()
      }

      if (isVideo) {
        if (!VIDEO_EXTS.includes(outExt)) {
          return res.status(400).json({
            message: 'Supported video formats: MP4, WEBM, MOV, M4V, OGG.',
          })
        }
      } else if (!IMAGE_EXTS.includes(outExt)) {
        // Default to jpg so the browser can display it
        outExt = '.jpg'
        if (sharp) {
          outBuffer = await sharp(file.buffer).jpeg({ quality: 88 }).toBuffer()
        }
      }

      const filename = `${safeBase}-${stamp}${outExt}`
      const runtime = getUploadRuntimeStatus()
      if (!runtime.ready) {
        return res.status(503).json({
          message:
            'Production uploads require Cloudinary configuration. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET, or temporarily allow local uploads explicitly.',
        })
      }

      const uploaded =
        (await uploadToCloudinary({
          buffer: outBuffer,
          filename,
          mimeType: file.mimetype,
        })) || saveLocally({ buffer: outBuffer, filename, req })

      return res.status(201).json({
        url: uploaded.url,
        absoluteUrl: uploaded.absoluteUrl,
        provider: uploaded.provider,
        kind: isVideo ? 'video' : 'image',
      })
    } catch (e) {
      return res.status(400).json({ message: e.message || 'Upload failed' })
    }
  })
})

module.exports = router
