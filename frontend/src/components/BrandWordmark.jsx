import { useMemo } from 'react'
import { useSiteAssets } from './SiteAssetsProvider'
import { toAssetUrl } from '../utils/media'
import { BUSINESS } from '../config/business'
import fallbackWordmark from '../assets/itrati-wordmark-transparent-v2.png'

function BrandWordmark({ className = '' }) {
  const { assets } = useSiteAssets()
  const url = assets?.['site.wordmark'] || ''

  const src = useMemo(
    () => (url ? toAssetUrl(url, import.meta.env.VITE_API_ASSET) : fallbackWordmark),
    [url]
  )

  return (
    <img
      src={src}
      alt={BUSINESS.displayName}
      title={BUSINESS.displayName}
      className={`block h-10 w-auto max-w-[11rem] object-contain drop-shadow-[0_4px_10px_rgba(145,102,16,0.22)] sm:h-14 sm:max-w-[15rem] ${className}`}
    />
  )
}

export default BrandWordmark
