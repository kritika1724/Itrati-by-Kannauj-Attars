import { useMemo } from 'react'
import { useSiteAssets } from './SiteAssetsProvider'
import { getResponsiveImageProps } from '../utils/media'
import { BUSINESS } from '../config/business'

function LogoMark({ className = '' }) {
  const { assets } = useSiteAssets()

  const url = assets?.['site.logo'] || ''
  const imageProps = useMemo(
    () =>
      url
        ? getResponsiveImageProps(url, {
            assetBase: import.meta.env.VITE_API_ASSET,
            widths: [72, 112, 160, 224],
            sizes: '5rem',
            width: 160,
          })
        : null,
    [url]
  )
  const logoZoom = Math.min(Math.max(Number(assets?.['site.logo.zoom']) || 1, 1), 2.5)

  if (imageProps?.src) {
    return (
      <div
        className={`relative grid h-14 w-14 place-items-center overflow-hidden rounded-full border border-gold/25 bg-white shadow-sm ${className}`}
        aria-label={`${BUSINESS.displayName} logo`}
        title={BUSINESS.displayName}
      >
        <img
          {...imageProps}
          alt={BUSINESS.displayName}
          className="h-full w-full object-contain p-0.5 transition-transform duration-300"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          style={{ transform: `scale(${logoZoom})` }}
        />
      </div>
    )
  }

  return (
    <div
      className={`relative grid h-14 w-14 place-items-center rounded-full border border-gold/30 bg-white shadow-sm ${className}`}
      aria-label={`${BUSINESS.displayName} logo`}
      title={BUSINESS.displayName}
    >
      <div className="absolute inset-1 rounded-full bg-[radial-gradient(circle_at_top,rgba(201,162,74,0.26),rgba(255,255,255,0.94))]" />
      <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_180deg,rgba(201,162,74,0.08),rgba(17,27,58,0.06),rgba(201,162,74,0.10))] opacity-60" />
      <span className="relative font-display text-[15px] tracking-[0.18em] text-ink">
        K<span className="mx-0.5 text-gold">/</span>A
      </span>
    </div>
  )
}

export default LogoMark
