import { useMemo, useState } from 'react'
import { useSiteAssets } from './SiteAssetsProvider'
import { toAssetUrl } from '../utils/media'
import { BUSINESS } from '../config/business'
import fallbackWordmark from '../assets/itrati-wordmark-transparent-v3.png'

const OLD_MAX_ZOOM = 2.5

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
  const [naturalRatio, setNaturalRatio] = useState(0)
  const url = assets?.['site.wordmark'] || ''
  const savedZoom = Number(assets?.['site.wordmark.zoom'])
  const hasSavedOffset = Boolean(assets?.['site.wordmark.x'] || assets?.['site.wordmark.y'])
  const hasOnlyOldWeakZoom = Number.isFinite(savedZoom) && savedZoom <= OLD_MAX_ZOOM
  const shouldAutoTighten =
    url &&
    !hasSavedOffset &&
    naturalRatio > 0 &&
    naturalRatio < 2.4 &&
    (!Number.isFinite(savedZoom) || hasOnlyOldWeakZoom)
  const wordmarkZoom = url ? (shouldAutoTighten ? 5.15 : clampZoom(savedZoom)) : 1
  const wordmarkX = url ? clampOffset(assets?.['site.wordmark.x']) : 0
  const wordmarkY = url ? (shouldAutoTighten ? 20 : clampOffset(assets?.['site.wordmark.y'])) : 0

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
        className="absolute inset-0 transition-transform duration-300"
        style={{
          transform: `translate(${wordmarkX}%, ${wordmarkY}%)`,
          transformOrigin: 'center',
        }}
      >
        <img
          src={src}
          alt={BUSINESS.displayName}
          className="h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(145,102,16,0.22)] transition-transform duration-300"
          style={{
            transform: `scale(${wordmarkZoom})`,
            transformOrigin: 'center',
          }}
          onLoad={(event) => {
            const img = event.currentTarget
            setNaturalRatio(img.naturalHeight ? img.naturalWidth / img.naturalHeight : 0)
          }}
        />
      </span>
    </span>
  )
}

export default BrandWordmark
