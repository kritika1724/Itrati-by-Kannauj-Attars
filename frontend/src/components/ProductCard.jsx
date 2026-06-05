import { memo } from 'react'
import { Link } from 'react-router-dom'
import { FiEye } from 'react-icons/fi'
import { toAssetUrl } from '../utils/media'
import { BUSINESS } from '../config/business'
import WishlistButton from './product/WishlistButton'
import { getBadgeList, getMinPack } from './product/productPresentation'

function ProductCard({ product, onView, onAdd, onQuickView, isAdmin = false, showActions = true }) {
  const minPack = getMinPack(Array.isArray(product?.packs) ? product.packs : [])
  const price = minPack ? minPack.effectivePrice : Number(product?.price || 0)
  const badges = getBadgeList(product)
  const sample = product?.sample || {}
  const sampleEnabled = sample.enabled === true && sample.label && Number(sample.price) > 0

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-[rgba(25,33,60,0.08)] bg-[rgba(255,255,255,0.96)] shadow-[0_14px_34px_rgba(25,33,60,0.06)] transition duration-300 hover:-translate-y-1 hover:border-[rgba(200,169,106,0.42)] hover:shadow-[0_22px_64px_rgba(25,33,60,0.10)] sm:rounded-[28px] sm:shadow-[0_18px_52px_rgba(25,33,60,0.07)] sm:hover:-translate-y-1.5 sm:hover:shadow-[0_28px_80px_rgba(25,33,60,0.12)]">
      <div className="relative p-2 sm:p-4">
        <Link to={`/products/${product._id}`} className="block overflow-hidden rounded-[16px] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,243,233,0.98))] sm:rounded-[22px]">
          <div className="relative aspect-[4/3.45] overflow-hidden rounded-[14px] sm:aspect-[4/4.15] sm:rounded-[22px]">
            <div className="pointer-events-none absolute inset-x-[18%] top-3 z-[1] h-16 rounded-full bg-[radial-gradient(circle,rgba(200,169,106,0.22),transparent_68%)] blur-2xl sm:top-4 sm:h-20" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-12 bg-[linear-gradient(180deg,transparent,rgba(21,28,52,0.14))] sm:h-16" />
            {product?.images?.[0] ? (
              <img
                src={toAssetUrl(product.images[0], import.meta.env.VITE_API_ASSET)}
                alt={product.name}
                className="relative z-[2] h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.06]"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(200,169,106,0.16),rgba(255,255,255,0.99),rgba(25,33,60,0.08))]">
                <span className="rounded-full border border-[rgba(200,169,106,0.28)] bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#19213C]">
                  {BUSINESS.brandName}
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-4.5rem)] flex-wrap gap-1 sm:left-6 sm:top-6 sm:max-w-[calc(100%-8rem)] sm:gap-2">
          {badges.map((badge) => (
            <span
              key={badge}
              className={`rounded-full px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.14em] shadow-sm sm:px-3 sm:text-[10px] sm:tracking-[0.24em] ${
                badge === 'Bestseller'
                  ? 'bg-[rgba(200,169,106,0.95)] text-[#1B233F]'
                  : 'bg-[rgba(25,33,60,0.82)] text-white'
              }`}
            >
              {badge}
            </span>
          ))}
        </div>

        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 sm:right-6 sm:top-6 sm:gap-2">
          {!isAdmin ? <WishlistButton productId={product._id} className="h-7 w-7 bg-white/92 sm:h-10 sm:w-10" /> : null}
          {onQuickView ? (
            <button
              type="button"
              onClick={() => onQuickView?.(product)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/80 bg-white/92 text-[#19213C] shadow-sm transition hover:bg-white sm:h-10 sm:w-auto sm:gap-2 sm:px-3 sm:text-xs sm:font-semibold sm:uppercase sm:tracking-[0.18em]"
              aria-label={`Quick view ${product.name}`}
            >
              <FiEye size={13} />
              <span className="hidden sm:inline">Quick view</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-2.5 pb-3 pt-0 sm:px-6 sm:pb-6 sm:pt-1">
        <div className="flex items-start justify-between gap-2.5">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8D7667] sm:text-xs sm:tracking-[0.24em]">{product?.category || 'Attar'}</p>
            <Link to={`/products/${product._id}`} className="mt-1.5 block sm:mt-2">
              <h3 className="line-clamp-2 text-[0.95rem] font-semibold leading-[1.15] tracking-[-0.03em] text-[#19213C] sm:text-2xl sm:leading-tight">
                {product.name}
              </h3>
            </Link>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-2 sm:mt-5 sm:gap-3">
          <div>
            <p className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8D7667] sm:block sm:text-xs sm:tracking-[0.24em]">Price</p>
            <div className="flex flex-wrap items-center gap-1.5 sm:mt-2 sm:gap-2">
              <span className="text-base font-semibold tracking-[-0.03em] text-[#19213C] sm:text-2xl">₹{Number(price || 0).toLocaleString('en-IN')}</span>
              {minPack?.onSale ? (
                <span className="text-xs text-[#8E8E96] line-through sm:text-sm">₹{Number(minPack.price || 0).toLocaleString('en-IN')}</span>
              ) : null}
            </div>
            {minPack?.label ? <p className="mt-0.5 text-[10px] text-[#6B6F7A] sm:mt-1 sm:text-sm">{minPack.label}</p> : null}
          </div>
          <span className="hidden rounded-full bg-[rgba(25,33,60,0.06)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#47506A] sm:inline-flex sm:px-3 sm:text-xs sm:tracking-[0.2em]">
            Made in Kannauj
          </span>
        </div>

        {sampleEnabled ? (
          <button
            type="button"
            onClick={() => onAdd?.({ mode: 'sample' })}
            className="mt-2.5 rounded-[14px] border border-[rgba(200,169,106,0.22)] bg-[rgba(255,250,244,0.96)] px-3 py-2 text-left transition hover:border-[rgba(200,169,106,0.38)] sm:mt-4 sm:rounded-[18px] sm:px-4 sm:py-3"
          >
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8D7667] sm:text-[11px] sm:tracking-[0.24em]">Buy a sample</p>
            <p className="mt-1 text-[11px] font-semibold text-[#19213C] sm:text-sm">
              <span className="sm:hidden">Sample ₹{Number(sample.price || 0).toLocaleString('en-IN')}</span>
              <span className="hidden sm:inline">
                {sample.label} • ₹{Number(sample.price || 0).toLocaleString('en-IN')}
              </span>
            </p>
          </button>
        ) : null}

        {showActions ? (
          <div className="mt-auto grid grid-cols-2 gap-1.5 pt-3 sm:gap-3 sm:pt-6">
            {!isAdmin ? (
              <button
                type="button"
                onClick={() => onAdd?.()}
                className="rounded-full bg-[linear-gradient(135deg,#E9D28A_0%,#C9A24A_100%)] px-2.5 py-2 text-[11px] font-semibold text-[#1B233F] shadow-[0_14px_28px_rgba(196,139,106,0.2)] transition hover:translate-y-[-1px] sm:px-5 sm:py-3 sm:text-sm sm:shadow-[0_18px_40px_rgba(196,139,106,0.24)]"
              >
                Add to Cart
              </button>
            ) : (
              <Link
                to={`/admin/products/${product._id}`}
                className="rounded-full bg-[linear-gradient(135deg,#E9D28A_0%,#C9A24A_100%)] px-2.5 py-2 text-center text-[11px] font-semibold text-[#1B233F] shadow-[0_14px_28px_rgba(196,139,106,0.2)] sm:px-5 sm:py-3 sm:text-sm sm:shadow-[0_18px_40px_rgba(196,139,106,0.24)]"
              >
                Edit product
              </Link>
            )}

            <button
              type="button"
              onClick={() => onView?.(product)}
              className="rounded-full border border-[rgba(25,33,60,0.12)] bg-white px-2.5 py-2 text-[11px] font-semibold text-[#19213C] transition hover:border-[rgba(200,169,106,0.38)] sm:px-5 sm:py-3 sm:text-sm"
            >
              Details
            </button>
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default memo(ProductCard)
