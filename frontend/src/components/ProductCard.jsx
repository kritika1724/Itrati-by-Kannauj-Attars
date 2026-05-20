import { memo, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toAssetUrl } from '../utils/media'
import { useTaxonomy } from './TaxonomyProvider'
import { BUSINESS } from '../config/business'

const getMinPack = (packs = []) => {
  const normalized = packs
    .map((p) => {
      const price = Number(p.price)
      const salePrice = p.salePrice === null || p.salePrice === undefined || p.salePrice === '' ? null : Number(p.salePrice)
      const onSale = Number.isFinite(salePrice) && salePrice > 0 && Number.isFinite(price) && salePrice < price
      return {
        label: (p.label || '').trim(),
        price,
        salePrice: onSale ? salePrice : null,
        effectivePrice: onSale ? salePrice : price,
        onSale,
      }
    })
    .filter((p) => p.label && !Number.isNaN(p.effectivePrice))
  if (!normalized.length) return null
  return normalized.reduce((min, p) => (p.effectivePrice < min.effectivePrice ? p : min), normalized[0])
}

const getShortDescription = (text, maxLength = 96) => {
  const value = String(text || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '').trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!value) return ''
  if (value.length <= maxLength) return value
  return `${value.slice(0, maxLength).trim()}...`
}

const clampImageZoom = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  return Math.min(Math.max(n, 1), 2.5)
}

function ProductCard({ product, onView, onAdd, isAdmin, showActions = true }) {
  const { purposeMap, familyMap } = useTaxonomy()
  const minPack = useMemo(() => getMinPack(Array.isArray(product?.packs) ? product.packs : []), [product?.packs])
  const showPack = Array.isArray(product?.packs) && product.packs.length && minPack
  const shortDescription = getShortDescription(product?.description, 96)
  const hasReviews = Number(product?.numReviews || 0) > 0
  const priceLabel = showPack ? minPack.label : 'Base price'
  const onSale = Boolean(showPack && minPack?.onSale)
  const sample = product?.sample || {}
  const sampleEnabled =
    sample.enabled === true && String(sample.label || '').trim() && !Number.isNaN(Number(sample.price))
  const imageZoom = clampImageZoom(product?.imageZoom)

  return (
    <article
      className="ka-hover-lift ka-shine-card group flex h-full flex-col overflow-hidden rounded-[1.9rem] border border-white/70 bg-[rgba(255,255,255,0.94)] shadow-[0_16px_48px_rgba(11,20,48,0.08)] transition duration-300 hover:border-gold/35 hover:shadow-[0_24px_70px_rgba(11,20,48,0.12)] sm:rounded-[2.1rem]"
    >
      <Link to={`/products/${product._id}`} className="block p-2.5 sm:p-3 md:p-4">
        <div
          className="relative aspect-[4/4.15] overflow-hidden rounded-[1.45rem] bg-[radial-gradient(circle_at_top,rgba(200,163,104,0.18),rgba(255,255,255,0.98)_55%,rgba(111,81,55,0.06))] sm:aspect-square sm:rounded-[1.7rem]"
        >
          <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(135deg,rgba(255,255,255,0.28),rgba(255,255,255,0)_45%,rgba(111,81,55,0.08))]" />
          <div className="pointer-events-none absolute inset-y-0 left-[-85%] z-[2] w-1/2 -skew-x-12 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.52),transparent)] opacity-0 transition-all duration-1000 group-hover:left-[140%] group-hover:opacity-100" />
          <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1.5 sm:left-3 sm:top-3">
            {product?.isBestSeller ? (
              <span className="rounded-full bg-gold px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-midnight sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.24em]">
                Best seller
              </span>
            ) : null}
            {product?.isNewArrival ? (
              <span className="rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-emberDark shadow-sm sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.24em]">
                New
              </span>
            ) : null}
            {onSale ? (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white shadow-sm sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.24em]">
                Sale
              </span>
            ) : null}
          </div>

          {product.images?.[0] ? (
            <div className="h-full w-full transition-transform duration-700 group-hover:scale-[1.06]">
              <img
                src={toAssetUrl(product.images[0], import.meta.env.VITE_API_ASSET)}
                alt={product.name}
                className="h-full w-full object-cover object-center"
                style={{ transform: `scale(${imageZoom})` }}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(201,162,74,0.22),rgba(255,255,255,0.96),rgba(17,27,58,0.10))]">
              <span className="rounded-full border border-gold/25 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emberDark sm:px-4 sm:py-2 sm:text-[11px] sm:tracking-[0.24em]">
                {BUSINESS.brandName}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-2.5 pb-2.5 sm:px-4 sm:pb-4 md:px-5 md:pb-5">
        <Link to={`/products/${product._id}`} className="block">
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-ink sm:text-base md:text-lg md:leading-snug">
            {product.name}
          </h3>
        </Link>

        {shortDescription ? <p className="mt-2 hidden text-sm leading-6 text-muted md:block">{shortDescription}</p> : null}

        {((Array.isArray(product.purposeTags) && product.purposeTags.length > 0) ||
          (Array.isArray(product.familyTags) && product.familyTags.length > 0)) ? (
          <div className="mt-3 hidden flex-wrap gap-2 md:flex">
            {(product.purposeTags || []).slice(0, 1).map((id) => (
              <span key={id} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-emberDark">
                {purposeMap[id] || id}
              </span>
            ))}
            {(product.familyTags || []).slice(0, 2).map((id) => (
              <span key={id} className="rounded-full bg-clay/70 px-3 py-1 text-[11px] font-semibold text-emberDark">
                {familyMap[id] || id}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex items-end justify-between gap-2 sm:mt-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted sm:text-[11px] sm:tracking-[0.24em]">
              {priceLabel}
            </p>
            {showPack ? (
              <div className="mt-1 flex flex-wrap items-center gap-1 sm:gap-2">
                <p className="text-base font-semibold text-ink sm:text-lg">₹{minPack.effectivePrice}</p>
                {minPack.onSale ? (
                  <p className="text-[11px] font-medium text-muted line-through sm:text-sm">₹{minPack.price}</p>
                ) : null}
                <span className="text-[11px] font-medium text-muted sm:text-sm">{minPack.label}</span>
              </div>
            ) : (
              <p className="mt-1 text-base font-semibold text-ink sm:text-lg">₹{product.price}</p>
            )}
          </div>
          {hasReviews ? (
            <div className="hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-emberDark sm:block">
              {Number(product.rating || 0).toFixed(1)} / 5
            </div>
          ) : null}
        </div>

        {showActions ? (
          <div className="mt-auto pt-3 grid grid-cols-2 gap-2 sm:pt-5">
            {!isAdmin ? (
              <button
                type="button"
                onClick={onAdd}
                className="ka-btn-primary px-3 py-2 text-[11px] sm:px-4 sm:py-2.5 sm:text-xs md:text-sm"
              >
                Add to cart
              </button>
            ) : (
              <Link
                to={`/admin/products/${product._id}`}
                className="ka-btn-primary px-3 py-2 text-center text-[11px] sm:px-4 sm:py-2.5 sm:text-xs md:text-sm"
              >
                Edit (Admin)
              </Link>
            )}
            <button
              type="button"
              onClick={onView}
              className="ka-btn-ghost px-3 py-2 text-[11px] sm:px-4 sm:py-2.5 sm:text-xs md:text-sm"
            >
              View
            </button>
          </div>
        ) : null}

        {showActions && !isAdmin && sampleEnabled ? (
          <button
            type="button"
            onClick={() => onAdd?.({ mode: 'sample' })}
            className="mt-3 hidden items-center justify-between gap-3 rounded-2xl border border-gold/20 bg-clay/50 px-4 py-3 text-left transition hover:border-gold/40 hover:bg-clay/70 md:inline-flex"
          >
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-muted">Try first</span>
              <span className="mt-1 block text-sm font-semibold text-ink">
                Buy a sample
                <span className="ml-2 text-xs font-medium text-muted">
                  {sample.label} • ₹{sample.price}
                </span>
              </span>
            </span>
            <span className="text-xs font-semibold text-emberDark">Quick add</span>
          </button>
        ) : null}
      </div>
    </article>
  )
}

export default memo(ProductCard)
