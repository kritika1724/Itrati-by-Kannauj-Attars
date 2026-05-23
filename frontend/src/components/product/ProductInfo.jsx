import { FiGift, FiShield, FiStar, FiTruck } from 'react-icons/fi'
import WishlistButton from './WishlistButton'
import {
  getAvailableSizesText,
  getBadgeList,
  getDisplayCategory,
  getFragranceNotes,
  getNoteLine,
  getOccasionHighlights,
  getRatingMeta,
  getShortDescription,
  getTrustBadges,
} from './productPresentation'

function ProductInfo({
  product,
  familyMap = {},
  purposeMap = {},
  isAdmin = false,
  selectedPackLabel = '',
  onSelectPack,
  qty = 1,
  onQtyChange,
  priceMeta,
  bulkPackSelected = false,
  onAddToCart,
  onBuyNow,
  onContactBulk,
}) {
  const rating = getRatingMeta(product)
  const noteLine = getNoteLine(product, familyMap)
  const notes = getFragranceNotes(product, familyMap)
  const trustBadges = getTrustBadges(product)
  const occasionHighlights = getOccasionHighlights(product, purposeMap)
  const shortDescription = getShortDescription(product?.description, 190)
  const badges = getBadgeList(product)
  const availableSizesText = getAvailableSizesText(product)
  const sample = product?.sample || {}
  const sampleEnabled = sample.enabled === true && sample.label && Number(sample.price) > 0
  const packs = Array.isArray(product?.packs) ? product.packs : []

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-[rgba(25,33,60,0.08)] bg-[rgba(255,255,255,0.88)] p-5 shadow-[0_26px_80px_rgba(25,33,60,0.08)] backdrop-blur-xl sm:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[rgba(200,169,106,0.34)] bg-[rgba(200,169,106,0.10)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#C9A24A]">
            {getDisplayCategory(product?.category)}
          </span>
          {badges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-[rgba(25,33,60,0.08)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#19213C]"
            >
              {badge}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl leading-tight tracking-[-0.04em] text-[#19213C] sm:text-4xl xl:text-[3.3rem]">
              {product?.name}
            </h1>
            <p className="mt-3 text-sm font-medium tracking-[0.08em] text-[#C9A24A] sm:text-base">{noteLine}</p>
          </div>
          {!isAdmin ? <WishlistButton productId={product?._id} className="shrink-0" /> : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[#5F6475]">
          <div className="inline-flex items-center gap-1.5 text-[#19213C]">
            {Array.from({ length: 5 }).map((_, index) => {
              const filled = index < Math.round(rating.value || 0)
              return <FiStar key={index} className={filled ? 'fill-current text-[#C9A24A]' : 'text-[#D3D7E0]'} size={15} />
            })}
            <span className="ml-2 font-semibold text-[#19213C]">{rating.value ? rating.value.toFixed(1) : 'New'}</span>
          </div>
          <span>{rating.count > 0 ? `${rating.count} review${rating.count > 1 ? 's' : ''}` : 'Freshly listed'}</span>
          <span>{BUSINESS_NOTE}</span>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8D7667]">Price</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="text-3xl font-semibold tracking-[-0.04em] text-[#19213C]">₹{Number(priceMeta?.effectivePrice || 0).toLocaleString('en-IN')}</p>
              {priceMeta?.onSale ? (
                <p className="text-base font-medium text-[#8E8E96] line-through">₹{Number(priceMeta.price).toLocaleString('en-IN')}</p>
              ) : null}
            </div>
            {priceMeta?.label ? <p className="mt-1 text-sm text-[#6B6F7A]">Pack: {priceMeta.label}</p> : null}
          </div>
        </div>

        <p className="mt-6 max-w-2xl text-sm leading-7 text-[#5F6475] sm:text-base sm:leading-8">{shortDescription}</p>

        {packs.length > 0 ? (
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8D7667]">Choose size</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {packs.map((pack) => {
                const active = selectedPackLabel === pack.label
                const regularPrice = Number(pack.price)
                const salePrice = pack.salePrice === null || pack.salePrice === undefined || pack.salePrice === '' ? null : Number(pack.salePrice)
                const effective = Number.isFinite(salePrice) && salePrice > 0 && salePrice < regularPrice ? salePrice : regularPrice
                return (
                  <button
                    key={pack.label}
                    type="button"
                    onClick={() => onSelectPack?.(pack.label)}
                    className={`rounded-[1.3rem] border px-4 py-3 text-left transition ${
                      active
                        ? 'border-[rgba(200,169,106,0.48)] bg-[rgba(200,169,106,0.10)] shadow-[0_16px_42px_rgba(200,169,106,0.14)]'
                        : 'border-[rgba(25,33,60,0.08)] bg-white hover:border-[rgba(200,169,106,0.28)]'
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#19213C]">{pack.label}</p>
                    <p className="mt-1 text-xs text-[#6B6F7A]">₹{Number(effective || 0).toLocaleString('en-IN')}</p>
                  </button>
                )
              })}
            </div>
          </div>
        ) : null}

        {availableSizesText ? (
          <div className="mt-4 rounded-[1.4rem] border border-[rgba(25,33,60,0.08)] bg-[rgba(252,249,243,0.92)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8D7667]">Available sizes</p>
            <p className="mt-2 text-sm font-medium leading-7 text-[#47506A]">{availableSizesText}</p>
          </div>
        ) : null}

        {!isAdmin ? (
          <div className="mt-8 grid gap-4 md:grid-cols-[auto_1fr] md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8D7667]">Quantity</p>
              <div className="mt-3 inline-flex items-center gap-3 rounded-full border border-[rgba(25,33,60,0.08)] bg-white px-3 py-2">
                <button
                  type="button"
                  onClick={() => onQtyChange?.(Math.max(1, qty - 1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(25,33,60,0.08)] text-[#19213C] transition hover:border-[rgba(200,169,106,0.32)]"
                >
                  -
                </button>
                <span className="min-w-8 text-center text-sm font-semibold text-[#19213C]">{qty}</span>
                <button
                  type="button"
                  onClick={() => onQtyChange?.(Math.min(99, qty + 1))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(25,33,60,0.08)] text-[#19213C] transition hover:border-[rgba(200,169,106,0.32)]"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
              <button
                type="button"
                onClick={onAddToCart}
                disabled={bulkPackSelected}
                className="rounded-full bg-[linear-gradient(135deg,#E9D28A_0%,#C9A24A_100%)] px-6 py-3.5 text-sm font-semibold text-[#1B233F] shadow-[0_20px_44px_rgba(196,139,106,0.28)] transition hover:translate-y-[-1px] hover:shadow-[0_24px_52px_rgba(196,139,106,0.32)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add to Cart
              </button>
              <button
                type="button"
                onClick={onBuyNow}
                disabled={bulkPackSelected}
                className="rounded-full bg-[#19213C] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(25,33,60,0.22)] transition hover:bg-[#10162A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Buy Now
              </button>
              <button
                type="button"
                onClick={onContactBulk}
                className="rounded-full border border-[rgba(25,33,60,0.08)] bg-white px-5 py-3.5 text-sm font-semibold text-[#19213C] transition hover:border-[rgba(200,169,106,0.34)]"
              >
                Bulk enquiry
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 rounded-[1.5rem] border border-[rgba(200,169,106,0.2)] bg-[rgba(255,251,243,0.92)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8D7667]">Admin mode</p>
            <p className="mt-2 text-sm leading-7 text-[#5F6475]">You are viewing the customer-facing product detail with admin access. Use the admin product form to update media, packs, pricing, or collections.</p>
          </div>
        )}

        {sampleEnabled && !isAdmin ? (
          <div className="mt-6 rounded-[1.6rem] border border-[rgba(200,169,106,0.22)] bg-[rgba(255,251,243,0.94)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#19213C]">Try a sample first</p>
                <p className="mt-1 text-sm text-[#5F6475]">{sample.label} sample available for ₹{sample.price}</p>
              </div>
              <span className="rounded-full border border-[rgba(200,169,106,0.28)] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#C9A24A]">Test before full pack</span>
            </div>
          </div>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {notes.top.length ? (
            <DetailPill title="Top Notes" items={notes.top} />
          ) : null}
          {notes.heart.length ? (
            <DetailPill title="Heart Notes" items={notes.heart} />
          ) : null}
          {notes.base.length ? (
            <DetailPill title="Base Notes" items={notes.base} />
          ) : null}
        </div>

        {occasionHighlights.length ? (
          <div className="mt-8 rounded-[1.6rem] border border-[rgba(25,33,60,0.08)] bg-white/90 p-4">
            <div className="flex flex-wrap gap-2">
              {occasionHighlights.map((item) => (
                <span key={item} className="rounded-full bg-[rgba(25,33,60,0.05)] px-3 py-2 text-xs font-semibold text-[#47506A]">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {trustBadges.map((badge, index) => {
          const icon = index === 0 ? <FiGift size={16} /> : index === 1 ? <FiShield size={16} /> : <FiTruck size={16} />
          return (
            <div
              key={badge}
              className="rounded-[1.5rem] border border-[rgba(25,33,60,0.08)] bg-white/84 px-4 py-4 text-sm font-semibold text-[#19213C] shadow-[0_16px_40px_rgba(25,33,60,0.05)]"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(200,169,106,0.12)] text-[#C9A24A]">
                  {icon}
                </span>
                <span>{badge}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DetailPill({ title, items }) {
  return (
    <div className="rounded-[1.6rem] border border-[rgba(25,33,60,0.08)] bg-white/88 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8D7667]">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <p key={item} className="text-sm font-medium text-[#19213C]">
            {item}
          </p>
        ))}
      </div>
    </div>
  )
}

const BUSINESS_NOTE = 'Heritage-crafted in Kannauj'

export default ProductInfo
