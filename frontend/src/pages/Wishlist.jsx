import { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiHeart, FiTrash2 } from 'react-icons/fi'
import { api } from '../services/api'
import { addToCart } from '../features/cartSlice'
import ProductCard from '../components/ProductCard'
import AddToCartModal from '../components/AddToCartModal'
import ProductToast from '../components/product/ProductToast'
import ProductQuickViewModal from '../components/product/ProductQuickViewModal'
import { wishlistStorage } from '../components/product/wishlist'
import { useTaxonomy } from '../components/TaxonomyProvider'
import { fadeUp, revealCard, staggerGrid } from '../lib/motion'
import { notifyCartItemAdded } from '../utils/cartLeadPrompt'
import { getProductPath } from '../utils/productLinks'

function Wishlist() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { familyMap } = useTaxonomy()
  const toastTimer = useRef(0)
  const [wishlistIds, setWishlistIds] = useState(() => wishlistStorage.read())
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ open: false, message: '' })
  const [cartModal, setCartModal] = useState({ open: false, product: null })
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  useEffect(() => {
    const sync = (event) => {
      const next = Array.isArray(event?.detail) ? event.detail : wishlistStorage.read()
      setWishlistIds(next)
    }

    window.addEventListener('wishlistchange', sync)
    return () => window.removeEventListener('wishlistchange', sync)
  }, [])

  useEffect(() => {
    let active = true

    const load = async () => {
      if (!wishlistIds.length) {
        setProducts([])
        setError('')
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      const results = await Promise.allSettled(wishlistIds.map((id) => api.getProduct(id)))
      if (!active) return

      const validProducts = []
      const validIds = []
      let loadFailed = false

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value?._id) {
          validProducts.push(result.value)
          validIds.push(String(result.value._id))
          return
        }

        const message = String(result.reason?.message || '')
        if (!/product not found|404/i.test(message)) {
          loadFailed = true
          validIds.push(String(wishlistIds[index] || ''))
        }
      })

      if (validIds.join('|') !== wishlistIds.join('|')) {
        wishlistStorage.set(validIds)
      }

      setProducts(validProducts)
      setError(loadFailed ? 'Some wishlist items could not be loaded right now.' : '')
      setLoading(false)
    }

    load()
    return () => {
      active = false
    }
  }, [wishlistIds])

  const showToast = (message) => {
    window.clearTimeout(toastTimer.current)
    setToast({ open: true, message })
    toastTimer.current = window.setTimeout(() => setToast({ open: false, message: '' }), 2600)
  }

  const handleCartConfirm = (selection) => {
    const product = cartModal.product
    if (!product) return

    const pack = Array.isArray(product.packs)
      ? product.packs.find((item) => (item.label || '').trim() === (selection.packLabel || '').trim())
      : null
    const regularPrice = Number(pack?.price || product.price)
    const salePrice =
      pack?.salePrice === null || pack?.salePrice === undefined || pack?.salePrice === ''
        ? null
        : Number(pack.salePrice)
    const effectivePrice =
      Number.isFinite(salePrice) && salePrice > 0 && salePrice < regularPrice ? salePrice : regularPrice

    dispatch(
      addToCart({
        product: product._id,
        name: product.name,
        price: effectivePrice,
        image: product.images?.[0] || '',
        packLabel: selection.packLabel || '',
        qty: selection.qty || 1,
        isSample: selection.isSample === true,
      })
    )
    notifyCartItemAdded({ productId: product._id, productName: product.name })

    setCartModal({ open: false, product: null })
    showToast(`${product.name} added to cart.`)
  }

  const clearWishlist = () => {
    if (typeof window !== 'undefined' && !window.confirm('Clear your wishlist?')) return
    wishlistStorage.clear()
    showToast('Wishlist cleared.')
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FFFDF8_0%,#F8F2E7_48%,#F7FAFF_100%)] text-[#19213C]">
      <header className="px-4 pb-10 pt-10 sm:px-6 lg:px-8">
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="mx-auto w-full max-w-7xl">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#8D7667]">Wishlist</p>
              <h1 className="mt-4 font-display text-4xl leading-[1.02] tracking-[-0.05em] text-[#19213C] sm:text-5xl xl:text-6xl">
                Saved for later
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[#5F6475] sm:text-lg">
                Keep your favorite attars, perfumes, rose waters, and oils in one calm place, then return whenever you are ready to explore more.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(200,169,106,0.28)] bg-white/92 px-4 py-2 text-sm font-semibold text-[#19213C]">
                <FiHeart className="text-[#C9A24A]" size={16} />
                {wishlistIds.length} saved
              </span>
              {wishlistIds.length > 0 ? (
                <button
                  type="button"
                  onClick={clearWishlist}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(25,33,60,0.1)] bg-white px-4 py-2 text-sm font-semibold text-[#19213C] transition hover:border-[rgba(200,169,106,0.38)]"
                >
                  <FiTrash2 size={15} />
                  Clear
                </button>
              ) : null}
            </div>
          </div>
        </motion.div>
      </header>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          {error ? (
            <p className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {error}
            </p>
          ) : null}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: Math.min(Math.max(wishlistIds.length, 1), 6) }).map((_, index) => (
                <div
                  key={index}
                  className="h-[29rem] animate-pulse rounded-[2rem] border border-[rgba(25,33,60,0.08)] bg-white/80 shadow-[0_18px_50px_rgba(25,33,60,0.06)]"
                />
              ))}
            </div>
          ) : wishlistIds.length === 0 ? (
            <div className="rounded-[2rem] border border-[rgba(25,33,60,0.08)] bg-white/92 px-6 py-12 text-center shadow-[0_24px_70px_rgba(25,33,60,0.08)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(200,169,106,0.12)] text-[#C9A24A]">
                <FiHeart size={24} />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-[#19213C]">Your wishlist is empty</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#5F6475] sm:text-base">
                Tap the heart on any product to save it here. This makes it easy for users to compare fragrances before adding them to cart.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/products"
                  className="rounded-full bg-[#19213C] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(25,33,60,0.18)] transition hover:bg-[#10162A]"
                >
                  Explore products
                </Link>
                <Link
                  to="/collections"
                  className="rounded-full border border-[rgba(25,33,60,0.1)] bg-white px-5 py-3 text-sm font-semibold text-[#19213C] transition hover:border-[rgba(200,169,106,0.38)]"
                >
                  Browse collections
                </Link>
              </div>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={staggerGrid(0.08, 0.04)}
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
            >
              {products.map((product) => (
                <motion.div key={product._id} variants={revealCard}>
                  <ProductCard
                    product={product}
                    onAdd={() => setCartModal({ open: true, product })}
                    onView={(item) => navigate(getProductPath(item), { state: { productId: item?._id } })}
                    onQuickView={(item) => setQuickViewProduct(item)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <AddToCartModal
        open={cartModal.open}
        product={cartModal.product}
        onClose={() => setCartModal({ open: false, product: null })}
        onConfirm={handleCartConfirm}
      />

      <ProductQuickViewModal
        product={quickViewProduct}
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        familyMap={familyMap}
        onAddToCart={(product) => {
          setQuickViewProduct(null)
          setCartModal({ open: true, product })
        }}
      />

      <ProductToast open={toast.open} message={toast.message} />
    </div>
  )
}

export default Wishlist
