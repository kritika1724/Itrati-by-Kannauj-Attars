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

const cleanAssetPath = (value) => String(value || '').split('#')[0].split('?')[0].toLowerCase()

export const isVideoAssetUrl = (rawUrl) => {
  const path = cleanAssetPath(rawUrl)
  return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext))
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
