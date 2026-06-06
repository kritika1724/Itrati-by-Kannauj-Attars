import { useMemo } from 'react'
import { useSiteAssets } from './SiteAssetsProvider'
import { toAssetUrl } from '../utils/media'
import { BUSINESS } from '../config/business'
import fallbackWordmark from '../assets/itrati-wordmark-transparent-v3.png'

const OLD_MAX_ZOOM = 2.5
const PADDED_IMAGE_AUTO_ZOOM = 1.75

const clampZoom = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  return Math.min(Math.max(n, 1), 8)
}

const clampOffset = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(Math.max(n, -50), 50)
}

function BrandWordmark({ className = '' }) {
  const { assets } = useSiteAssets()
  const url = assets?.['site.wordmark'] || ''
  const savedZoom = Number(assets?.['site.wordmark.zoom'])
  const hasSavedOffset = Boolean(assets?.['site.wordmark.x'] || assets?.['site.wordmark.y'])
  const shouldUseStableAutoFit =
    url && !hasSavedOffset && (!Number.isFinite(savedZoom) || savedZoom <= OLD_MAX_ZOOM)
  const wordmarkZoom = url ? (shouldUseStableAutoFit ? PADDED_IMAGE_AUTO_ZOOM : clampZoom(savedZoom)) : 1
  const wordmarkX = url ? clampOffset(assets?.['site.wordmark.x']) : 0
  const wordmarkY = url ? clampOffset(assets?.['site.wordmark.y']) : 0
  const objectFitClass = shouldUseStableAutoFit ? 'object-cover' : 'object-contain'

  const src = useMemo(
    () => (url ? toAssetUrl(url, import.meta.env.VITE_API_ASSET) : fallbackWordmark),
    [url]
  )

  return (
    <span
      className={`relative block h-10 w-[11rem] max-w-full overflow-hidden sm:h-14 sm:w-[15rem] ${className}`}
      title={BUSINESS.displayName}
    >
      <span
        className="absolute inset-0"
        style={{
          transform: `translate3d(${wordmarkX}%, ${wordmarkY}%, 0)`,
          transformOrigin: 'center',
        }}
      >
        <img
          src={src}
          alt={BUSINESS.displayName}
          className={`h-full w-full ${objectFitClass} drop-shadow-[0_3px_7px_rgba(145,102,16,0.18)] sm:drop-shadow-[0_4px_10px_rgba(145,102,16,0.22)]`}
          style={{
            transform: `scale(${wordmarkZoom})`,
            transformOrigin: 'center',
          }}
        />
      </span>
    </span>
  )
}

export default BrandWordmark
