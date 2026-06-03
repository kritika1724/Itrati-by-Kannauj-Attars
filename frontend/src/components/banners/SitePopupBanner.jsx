import { Link, useLocation } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { useSiteAssets } from '../SiteAssetsProvider'
import { usePopupBannerContent } from '../../hooks/useSiteContentBlocks'
import { toAssetUrl } from '../../utils/media'

const POPUP_DISMISS_PREFIX = 'ka:popup-banner:dismissed:'

const isExternalHref = (value) => /^(https?:|mailto:|tel:)/i.test(String(value || '').trim())

const shouldSuppressOnPath = (pathname) =>
  pathname.startsWith('/admin') ||
  pathname.startsWith('/checkout') ||
  pathname === '/account' ||
  pathname.startsWith('/oauth/')

function BannerAction({ href, label, onClick, primary = false }) {
  const className = primary
    ? 'inline-flex items-center justify-center rounded-full bg-[#19213C] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#10162A]'
    : 'inline-flex items-center justify-center rounded-full border border-[rgba(25,33,60,0.10)] bg-white/85 px-4 py-2 text-sm font-semibold text-[#19213C] transition hover:border-[rgba(200,169,106,0.42)]'

  if (!href || !label) return null
  if (isExternalHref(href)) {
    return (
      <a
        href={href}
        onClick={onClick}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noreferrer' : undefined}
        className={className}
      >
        {label}
      </a>
    )
  }

  return (
    <Link to={href} onClick={onClick} className={className}>
      {label}
    </Link>
  )
}

function SitePopupBanner() {
  const banner = usePopupBannerContent()
  const { assets } = useSiteAssets()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const imageSrc = useMemo(() => {
    const raw = assets?.['banner.popup.image'] || ''
    return raw ? toAssetUrl(raw, import.meta.env.VITE_API_ASSET) : ''
  }, [assets])

  const signature = useMemo(
    () =>
      JSON.stringify({
        enabled: banner.enabled,
        kicker: banner.kicker,
        title: banner.title,
        description: banner.description,
        ctaLabel: banner.ctaLabel,
        ctaHref: banner.ctaHref,
        dismissLabel: banner.dismissLabel,
        imageSrc,
      }),
    [banner, imageSrc]
  )

  const dismissStorageKey = `${POPUP_DISMISS_PREFIX}${signature}`

  useEffect(() => {
    if (banner.enabled !== true || shouldSuppressOnPath(location.pathname)) {
      setOpen(false)
      return
    }

    if (banner.showOncePerSession) {
      try {
        if (window.sessionStorage.getItem(dismissStorageKey) === '1') {
          setOpen(false)
          return
        }
      } catch {
        // ignore storage issues
      }
    }

    setOpen(true)
  }, [banner.enabled, banner.showOncePerSession, dismissStorageKey, location.pathname])

  const close = () => {
    if (banner.showOncePerSession) {
      try {
        window.sessionStorage.setItem(dismissStorageKey, '1')
      } catch {
        // ignore storage issues
      }
    }
    setOpen(false)
  }

  if (!open) return null

  return (
    <motion.aside
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-4 right-4 z-[90] w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-[1.8rem] border border-[rgba(200,169,106,0.26)] bg-[linear-gradient(180deg,rgba(255,252,246,0.98),rgba(255,255,255,0.98))] shadow-[0_28px_80px_rgba(25,33,60,0.18)] sm:bottom-6 sm:right-6"
    >
      <button
        type="button"
        onClick={close}
        className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(25,33,60,0.10)] bg-white/92 text-[#19213C] transition hover:border-[rgba(200,169,106,0.42)]"
        aria-label={banner.dismissLabel || 'Close popup banner'}
        title={banner.dismissLabel || 'Close'}
      >
        <FiX size={16} />
      </button>

      <div className="flex flex-col">
        {imageSrc ? (
          <div className="h-36 w-full overflow-hidden border-b border-[rgba(200,169,106,0.18)] bg-[radial-gradient(circle_at_top,rgba(201,162,74,0.14),rgba(255,255,255,0.96))]">
            <img
              src={imageSrc}
              alt={banner.title || 'Popup banner'}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}

        <div className="p-5 sm:p-6">
          <div className="pr-10">
            {banner.kicker ? (
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#8D7667]">{banner.kicker}</p>
            ) : null}
            {banner.title ? (
              <h3 className="mt-2 text-lg font-semibold leading-6 text-[#19213C] sm:text-xl">{banner.title}</h3>
            ) : null}
            {banner.description ? (
              <p className="mt-3 text-sm leading-6 text-[#5F6475]">{banner.description}</p>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <BannerAction href={banner.ctaHref} label={banner.ctaLabel} onClick={close} primary />
            {banner.dismissLabel ? (
              <button
                type="button"
                onClick={close}
                className="inline-flex items-center justify-center rounded-full border border-[rgba(25,33,60,0.10)] bg-white/85 px-4 py-2 text-sm font-semibold text-[#19213C] transition hover:border-[rgba(200,169,106,0.42)]"
              >
                {banner.dismissLabel}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </motion.aside>
  )
}

export default SitePopupBanner
