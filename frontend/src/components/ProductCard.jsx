import { memo } from 'react'
import { Link } from 'react-router-dom'
import { FiEye, FiStar } from 'react-icons/fi'
import { toAssetUrl } from '../utils/media'
import { useTaxonomy } from './TaxonomyProvider'
import { BUSINESS } from '../config/business'
import WishlistButton from './product/WishlistButton'
import { getBadgeList, getMinPack, getNoteLine, getRatingMeta } from './product/productPresentation'

function ProductCard({ product, onView, onAdd, onQuickView, isAdmin = false, showActions = true }) {
  const { familyMap } = useTaxonomy()
  const minPack = getMinPack(Array.isArray(product?.packs) ? product.packs : [])
  const price = minPack ? minPack.effectivePrice : Number(product?.price || 0)
  const badges = getBadgeList(product)
  const rating = getRatingMeta(product)
  const noteLine = getNoteLine(product, familyMap)
  const sample = product?.sample || {}
  const sampleEnabled = sample.enabled === true && sample.label && Number(sample.price) > 0

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-[rgba(25,33,60,0.08)] bg-[rgba(255,255,255,0.96)] shadow-[0_18px_52px_rgba(25,33,60,0.07)] transition duration-300 hover:-translate-y-1.5 hover:border-[rgba(200,169,106,0.42)] hover:shadow-[0_28px_80px_rgba(25,33,60,0.12)]">
      <div className="relative p-3 sm:p-4">
        <Link to={`/products/${product._id}`} className="block overflow-hidden rounded-[22px] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(249,243,233,0.98))]">
          <div className="relative aspect-[4/4.15] overflow-hidden rounded-[22px]">
            <div className="pointer-events-none absolute inset-x-[18%] top-4 z-[1] h-20 rounded-full bg-[radial-gradient(circle,rgba(200,169,106,0.22),transparent_68%)] blur-2xl" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-16 bg-[linear-gradient(180deg,transparent,rgba(21,28,52,0.14))]" />
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

        <div className="absolute left-6 top-6 z-10 flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge}
              className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] shadow-sm ${
                badge === 'Bestseller'
                  ? 'bg-[rgba(200,169,106,0.95)] text-[#1B233F]'
                  : badge === 'New'
                    ? 'bg-white/92 text-[#19213C]'
                    : 'bg-[rgba(25,33,60,0.82)] text-white'
              }`}
            >
              {badge}
            </span>
          ))}
        </div>

        <div className="absolute right-6 top-6 z-10 flex items-center gap-2">
          {!isAdmin ? <WishlistButton productId={product._id} className="h-10 w-10 bg-white/92" /> : null}
          {onQuickView ? (
            <button
              type="button"
              onClick={() => onQuickView?.(product)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/80 bg-white/92 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#19213C] shadow-sm transition hover:bg-white"
            >
              <FiEye size={14} />
              Quick view
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-1 sm:px-6 sm:pb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8D7667]">{product?.category || 'Attar'}</p>
            <Link to={`/products/${product._id}`} className="mt-2 block">
              <h3 className="line-clamp-2 text-2xl font-semibold leading-tight tracking-[-0.03em] text-[#19213C]">
                {product.name}
              </h3>
            </Link>
          </div>
        </div>

        <p className="mt-3 text-sm font-medium text-[#C9A24A]">{noteLine}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 text-[#C9A24A]">
            {Array.from({ length: 5 }).map((_, index) => {
              const filled = index < Math.round(rating.value || 0)
              return <FiStar key={index} className={filled ? 'fill-current' : 'text-[#D8DCE4]'} size={14} />
            })}
            <span className="ml-2 text-sm font-semibold text-[#19213C]">{rating.value ? rating.value.toFixed(1) : 'New'}</span>
          </div>
          {rating.count > 0 ? <span className="text-xs text-[#6B6F7A]">{rating.count} reviews</span> : <span className="text-xs text-[#6B6F7A]">Fresh listing</span>}
        </div>

        <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8D7667]">Starting price</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-2xl font-semibold tracking-[-0.03em] text-[#19213C]">₹{Number(price || 0).toLocaleString('en-IN')}</span>
              {minPack?.onSale ? (
                <span className="text-sm text-[#8E8E96] line-through">₹{Number(minPack.price || 0).toLocaleString('en-IN')}</span>
              ) : null}
            </div>
            {minPack?.label ? <p className="mt-1 text-sm text-[#6B6F7A]">{minPack.label}</p> : null}
          </div>
          <span className="rounded-full bg-[rgba(25,33,60,0.06)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#47506A]">
            Made in Kannauj
          </span>
        </div>

        {sampleEnabled ? (
          <button
            type="button"
            onClick={() => onAdd?.({ mode: 'sample' })}
            className="mt-4 rounded-[18px] border border-[rgba(200,169,106,0.22)] bg-[rgba(255,250,244,0.96)] px-4 py-3 text-left transition hover:border-[rgba(200,169,106,0.38)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8D7667]">Buy a sample</p>
            <p className="mt-1 text-sm font-semibold text-[#19213C]">
              {sample.label} • ₹{Number(sample.price || 0).toLocaleString('en-IN')}
            </p>
          </button>
        ) : null}

        {showActions ? (
          <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
            {!isAdmin ? (
              <button
                type="button"
                onClick={() => onAdd?.()}
                className="rounded-full bg-[linear-gradient(135deg,#E9D28A_0%,#C9A24A_100%)] px-5 py-3 text-sm font-semibold text-[#1B233F] shadow-[0_18px_40px_rgba(196,139,106,0.24)] transition hover:translate-y-[-1px]"
              >
                Add to Cart
              </button>
            ) : (
              <Link
                to={`/admin/products/${product._id}`}
                className="rounded-full bg-[linear-gradient(135deg,#E9D28A_0%,#C9A24A_100%)] px-5 py-3 text-center text-sm font-semibold text-[#1B233F] shadow-[0_18px_40px_rgba(196,139,106,0.24)]"
              >
                Edit product
              </Link>
            )}

            <button
              type="button"
              onClick={() => onView?.(product)}
              className="rounded-full border border-[rgba(25,33,60,0.12)] bg-white px-5 py-3 text-sm font-semibold text-[#19213C] transition hover:border-[rgba(200,169,106,0.38)]"
            >
              View Details
            </button>
          </div>
        ) : null}
      </div>
    </article>
  )
}

export default memo(ProductCard)
