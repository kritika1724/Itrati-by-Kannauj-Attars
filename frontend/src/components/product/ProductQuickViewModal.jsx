import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX } from 'react-icons/fi'
import { toAssetUrl } from '../../utils/media'
import { getBadgeList, getMinPack, getNoteLine, getProductImages, getShortDescription } from './productPresentation'
import WishlistButton from './WishlistButton'

function ProductQuickViewModal({ product, open, onClose, familyMap = {}, onAddToCart, isAdmin = false }) {
  if (typeof document === 'undefined') return null
  if (!open || !product) return null

  const images = getProductImages(product)
  const minPack = getMinPack(Array.isArray(product?.packs) ? product.packs : [])
  const price = minPack ? minPack.effectivePrice : product?.price
  const badges = getBadgeList(product)

  return createPortal(
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[78]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <button
          type="button"
          onClick={onClose}
          className="absolute inset-0 bg-[rgba(15,18,30,0.46)] backdrop-blur-[3px]"
          aria-label="Close quick view"
        />
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-4 left-1/2 w-[calc(100%-2rem)] max-w-[90rem] -translate-x-1/2 overflow-hidden rounded-[2rem] border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.96)] shadow-[0_36px_100px_rgba(25,33,60,0.26)] backdrop-blur-2xl sm:bottom-auto sm:top-1/2 sm:max-h-[min(52rem,90vh)] sm:w-[min(92vw,90rem)] sm:-translate-y-1/2"
        >
          <div className="flex items-start justify-between gap-4 border-b border-[rgba(25,33,60,0.08)] px-5 py-5 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8D7667]">Quick view</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#19213C]">{product.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              {!isAdmin ? <WishlistButton productId={product._id} /> : null}
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(25,33,60,0.10)] bg-white text-[#19213C]"
              >
                <FiX size={18} />
              </button>
            </div>
          </div>

          <div className="grid max-h-[calc(90vh-5.5rem)] gap-6 overflow-y-auto p-5 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1.12fr)] lg:gap-8 lg:p-7">
            <div className="overflow-hidden rounded-[1.8rem] bg-[linear-gradient(135deg,rgba(200,169,106,0.16),rgba(255,255,255,0.98),rgba(25,33,60,0.08))] min-h-[20rem] lg:min-h-[32rem]">
              {images[0] ? (
                <img src={toAssetUrl(images[0], import.meta.env.VITE_API_ASSET)} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="aspect-[4/4.2] h-full w-full" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                {badges.map((badge) => (
                  <span key={badge} className="rounded-full border border-[rgba(200,169,106,0.34)] bg-[rgba(200,169,106,0.10)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#C9A24A]">
                    {badge}
                  </span>
                ))}
                <span className="rounded-full border border-[rgba(25,33,60,0.08)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#19213C]">
                  {product.category || 'Attar'}
                </span>
              </div>
              <p className="mt-4 text-sm font-medium tracking-[0.08em] text-[#C9A24A]">{getNoteLine(product, familyMap)}</p>
              <p className="mt-4 text-3xl font-semibold text-[#19213C]">₹{Number(price || 0).toLocaleString('en-IN')}</p>
              {minPack?.label ? <p className="mt-1 text-sm text-[#6B6F7A]">Starting from {minPack.label}</p> : null}
              <p className="mt-5 text-sm leading-7 text-[#5F6475]">{getShortDescription(product.description, 220)}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                {!isAdmin ? (
                  <button
                    type="button"
                    onClick={() => onAddToCart?.(product)}
                    className="rounded-full bg-[linear-gradient(135deg,#E9D28A_0%,#C9A24A_100%)] px-6 py-3 text-sm font-semibold text-[#1B233F] shadow-[0_18px_40px_rgba(196,139,106,0.24)]"
                  >
                    Add to cart
                  </button>
                ) : null}
                <Link
                  to={`/products/${product._id}`}
                  onClick={onClose}
                  className="rounded-full bg-[#19213C] px-6 py-3 text-sm font-semibold text-white"
                >
                  View details
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

export default ProductQuickViewModal
