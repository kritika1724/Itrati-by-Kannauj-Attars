export const toAssetUrl = (rawUrl, assetBase) => {
  if (!rawUrl) return ''

  const base =
    assetBase ||
    (() => {
      try {
        const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'
        // Support relative API bases like "/api" (recommended with Vite proxy).
        if (apiBase.startsWith('/')) return window.location.origin
        return new URL(apiBase).origin
      } catch {
        return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'
      }
    })()
  const url = String(rawUrl).trim()

  // External URL (keep as-is) unless it's clearly pointing at our /uploads path.
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url)
      if (parsed.pathname && parsed.pathname.startsWith('/uploads/')) {
        return `${base}${parsed.pathname}`
      }
    } catch {
      // If URL parsing fails, fall back to using it as-is.
    }
    return url
  }

  // Common mistake: "uploads/xyz.jpg" (missing leading slash)
  if (url.startsWith('uploads/')) return `${base}/${url}`

  // Relative uploads path stored in DB.
  if (url.startsWith('/uploads/')) return `${base}${url}`

  return url
}

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v', '.ogg']
const IMAGE_TRANSFORM_WIDTHS = [320, 480, 640, 960, 1280]

const cleanAssetPath = (value) => String(value || '').split('#')[0].split('?')[0].toLowerCase()

export const isVideoAssetUrl = (rawUrl) => {
  const path = cleanAssetPath(rawUrl)
  return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext))
}

const parseAbsoluteUrl = (value) => {
  try {
    return new URL(value)
  } catch {
    return null
  }
}

const isCloudinaryImageUrl = (url) => {
  const parsed = parseAbsoluteUrl(url)
  if (!parsed) return false

  const host = parsed.hostname.toLowerCase()
  return (
    (host === 'res.cloudinary.com' || host.endsWith('.cloudinary.com')) &&
    parsed.pathname.includes('/upload/') &&
    !isVideoAssetUrl(parsed.pathname)
  )
}

const normalizeWidths = (widths = IMAGE_TRANSFORM_WIDTHS) =>
  [...new Set((Array.isArray(widths) ? widths : IMAGE_TRANSFORM_WIDTHS).map((width) => Number(width)).filter((width) => Number.isFinite(width) && width > 0))]
    .map((width) => Math.round(width))
    .sort((a, b) => a - b)

const buildCloudinaryTransform = ({ width, quality = 'auto:good', format = 'auto', fit = 'limit' } = {}) => {
  const parts = []
  if (format) parts.push(`f_${format}`)
  if (quality) parts.push(`q_${quality}`)
  if (fit) parts.push(`c_${fit}`)
  if (Number.isFinite(Number(width)) && Number(width) > 0) parts.push(`w_${Math.round(Number(width))}`)
  return parts.join(',')
}

export const toOptimizedImageUrl = (rawUrl, { assetBase, width, quality, format, fit } = {}) => {
  const src = toAssetUrl(rawUrl, assetBase)
  if (!src || !isCloudinaryImageUrl(src)) return src

  const transform = buildCloudinaryTransform({ width, quality, format, fit })
  if (!transform) return src

  const parsed = parseAbsoluteUrl(src)
  if (!parsed) return src

  const marker = '/upload/'
  const markerIndex = parsed.pathname.indexOf(marker)
  if (markerIndex === -1) return src

  const beforeUpload = parsed.pathname.slice(0, markerIndex + marker.length)
  const afterUpload = parsed.pathname.slice(markerIndex + marker.length)
  parsed.pathname = `${beforeUpload}${transform}/${afterUpload}`
  return parsed.toString()
}

export const getResponsiveImageProps = (
  rawUrl,
  {
    assetBase,
    widths = IMAGE_TRANSFORM_WIDTHS,
    sizes = '100vw',
    width,
    quality = 'auto:good',
    format = 'auto',
    fit = 'limit',
  } = {}
) => {
  const src = toAssetUrl(rawUrl, assetBase)
  if (!src) return { src: '' }

  if (!isCloudinaryImageUrl(src)) {
    return { src, sizes }
  }

  const normalizedWidths = normalizeWidths(widths)
  const fallbackWidth = width || normalizedWidths[Math.min(normalizedWidths.length - 1, Math.max(0, Math.floor(normalizedWidths.length / 2)))]
  const imageOptions = { assetBase, quality, format, fit }

  return {
    src: toOptimizedImageUrl(rawUrl, { ...imageOptions, width: fallbackWidth }),
    srcSet: normalizedWidths
      .map((candidateWidth) => `${toOptimizedImageUrl(rawUrl, { ...imageOptions, width: candidateWidth })} ${candidateWidth}w`)
      .join(', '),
    sizes,
  }
}

export const getMediaAccept = (mode = 'media') => {
  if (mode === 'video') {
    return 'video/mp4,video/webm,video/quicktime,video/ogg,video/x-m4v,.mp4,.webm,.mov,.m4v,.ogg'
  }

  if (mode === 'image') {
    return 'image/*'
  }

  return `${getMediaAccept('image')},${getMediaAccept('video')}`
}
