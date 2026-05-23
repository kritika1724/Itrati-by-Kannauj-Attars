import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { api, auth } from '../services/api'
import { addToCart } from '../features/cartSlice'
import { viewProduct as trackView } from '../features/recentlyViewedSlice'
import RichTextContent from '../components/RichTextContent'
import RecentlyViewedStrip from '../components/RecentlyViewedStrip'
import { useTaxonomy } from '../components/TaxonomyProvider'
import { BUSINESS } from '../config/business'
import ProductAccordion from '../components/product/ProductAccordion'
import ProductGallery from '../components/product/ProductGallery'
import ProductInfo from '../components/product/ProductInfo'
import ProductToast from '../components/product/ProductToast'
import ReviewSection from '../components/product/ReviewSection'
import RelatedProducts from '../components/product/RelatedProducts'
import MobileStickyCart from '../components/product/MobileStickyCart'
import {
  getExperienceCopy,
  getHowToUseItems,
  getMinPack,
  getPriceMeta,
  getPurityItems,
  getShippingReturnItems,
} from '../components/product/productPresentation'

const schema = yup.object({
  orderId: yup.string().trim().required('Order ID is required.'),
  rating: yup.number().required('Rating is required.').min(1).max(5),
  comment: yup.string().max(1200).default(''),
})

const packToGrams = (label) => {
  const str = String(label || '').toLowerCase().replace(/,/g, '').trim()
  const kg = str.match(/(\d+(?:\.\d+)?)\s*kg\b/)
  if (kg) return Number(kg[1]) * 1000
  const gm = str.match(/(\d+(?:\.\d+)?)\s*(gm|g)\b/)
  if (gm) return Number(gm[1])
  return null
}

const isBulkPack = (label) => {
  const grams = packToGrams(label)
  return grams !== null && Number.isFinite(grams) && grams >= 1000
}

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { familyMap, purposeMap } = useTaxonomy()
  const toastTimer = useRef(0)
  const user = auth.getUser()
  const isAdmin = user?.isAdmin === true

  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')
  const [relatedProducts, setRelatedProducts] = useState([])
  const [qty, setQty] = useState(1)
  const [packLabel, setPackLabel] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewMessage, setReviewMessage] = useState('')
  const [toast, setToast] = useState({ open: false, message: '' })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { orderId: '', rating: 0, comment: '' },
  })

  const selectedRating = watch('rating')

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const showToast = (message) => {
    window.clearTimeout(toastTimer.current)
    setToast({ open: true, message })
    toastTimer.current = window.setTimeout(() => setToast({ open: false, message: '' }), 2600)
  }

  useEffect(() => {
    const load = async () => {
      try {
        setError('')
        const data = await api.getProduct(id)
        setProduct(data)
        setQty(1)
        setReviewOpen(false)
        setReviewMessage('')

        const minPack = getMinPack(Array.isArray(data?.packs) ? data.packs : [])
        const firstPack = minPack?.label || (Array.isArray(data?.packs) && data.packs.length ? data.packs[0].label || '' : '')
        setPackLabel(firstPack)

        dispatch(
          trackView({
            product: data._id,
            name: data.name,
            image: data.images?.[0] || '',
            price: minPack ? minPack.effectivePrice : data.price,
            packLabel: minPack ? minPack.label : '',
          })
        )

        try {
          const relatedMap = new Map()
          const addRelated = (items = []) => {
            items.forEach((item) => {
              if (String(item._id) !== String(data._id)) relatedMap.set(String(item._id), item)
            })
          }

          if (Array.isArray(data.familyTags) && data.familyTags.length) {
            const related = await api.getProducts({ family: data.familyTags.slice(0, 3).join(','), limit: 8 })
            addRelated(related.products)
          }
          if (relatedMap.size < 6 && Array.isArray(data.purposeTags) && data.purposeTags.length) {
            const related = await api.getProducts({ purpose: data.purposeTags.slice(0, 3).join(','), limit: 8 })
            addRelated(related.products)
          }
          if (relatedMap.size < 6 && data.category) {
            const related = await api.getProducts({ category: data.category, limit: 8 })
            addRelated(related.products)
          }

          setRelatedProducts([...relatedMap.values()].slice(0, 6))
        } catch {
          setRelatedProducts([])
        }
      } catch (err) {
        setError(err.message || 'Could not load product.')
      }
    }

    load()
  }, [dispatch, id])

  const priceMeta = useMemo(() => getPriceMeta(product, packLabel), [product, packLabel])
  const hasReviews = Array.isArray(product?.reviews) && product.reviews.length > 0
  const sample = product?.sample || {}
  const sampleEnabled = sample.enabled === true && sample.label && Number(sample.price) > 0
  const bulkPackSelected = isBulkPack(packLabel)

  const addCurrentSelectionToCart = ({ buyNow = false, sampleMode = false } = {}) => {
    if (!product) return

    if (sampleMode && sampleEnabled) {
      dispatch(
        addToCart({
          product: product._id,
          name: product.name,
          price: Number(sample.price),
          image: product.images?.[0] || '',
          packLabel: sample.label,
          isSample: true,
          qty,
        })
      )
      if (buyNow) navigate('/checkout/shipping')
      else showToast(`Sample for ${product.name} added to cart.`)
      return
    }

    dispatch(
      addToCart({
        product: product._id,
        name: product.name,
        price: Number(priceMeta?.effectivePrice || product.price || 0),
        image: product.images?.[0] || '',
        packLabel: packLabel || '',
        qty,
      })
    )

    if (buyNow) navigate('/checkout/shipping')
    else showToast(`${product.name} added to cart.`)
  }

  const onSubmit = async (formData) => {
    try {
      setReviewMessage('')
      await api.addReview(id, {
        orderId: String(formData.orderId || '').trim(),
        rating: Number(formData.rating),
        comment: String(formData.comment || '').trim(),
      })
      setReviewMessage('Review submitted.')
      const updated = await api.getProduct(id)
      setProduct(updated)
      reset({ orderId: '', rating: 0, comment: '' })
      setReviewOpen(false)
    } catch (err) {
      setReviewMessage(err.message || 'Could not submit review.')
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F2EA_52%,#FFFDF8_100%)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-6xl rounded-[2rem] border border-red-200 bg-white px-6 py-10 text-red-700 shadow-[0_18px_50px_rgba(25,33,60,0.06)]">
          <p className="font-semibold">Could not load product.</p>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F2EA_52%,#FFFDF8_100%)] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="aspect-[4/4.2] animate-pulse rounded-[2rem] bg-[rgba(226,217,203,0.48)]" />
          <div className="space-y-4">
            <div className="h-6 w-1/3 animate-pulse rounded-full bg-[rgba(226,217,203,0.4)]" />
            <div className="h-14 w-3/4 animate-pulse rounded-[1.2rem] bg-[rgba(226,217,203,0.44)]" />
            <div className="h-24 animate-pulse rounded-[1.6rem] bg-[rgba(226,217,203,0.36)]" />
          </div>
        </div>
      </div>
    )
  }

  const accordionItems = [
    { title: 'How to Use', content: getHowToUseItems(product) },
    { title: 'Ingredients / Purity', content: getPurityItems(product) },
    { title: 'Shipping & Returns', content: getShippingReturnItems(product) },
  ]

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F2EA_52%,#FFFDF8_100%)] text-[#19213C]">
      <section className="px-4 pb-8 pt-8 sm:px-6 lg:px-8 lg:pt-10">
        <div className="mx-auto w-full max-w-[1480px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link to="/products" className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8D7667] transition hover:text-[#C9A24A]">
              ← Back to product wall
            </Link>
            {isAdmin ? (
              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/admin/products/${product._id}`}
                  className="rounded-full bg-[#19213C] px-4 py-2 text-sm font-semibold text-white"
                >
                  Edit product
                </Link>
                <Link
                  to="/admin/products"
                  className="rounded-full border border-[rgba(25,33,60,0.1)] bg-white px-4 py-2 text-sm font-semibold text-[#19213C]"
                >
                  Admin products
                </Link>
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.96fr)_minmax(0,0.92fr)] xl:gap-10">
            <ProductGallery key={product._id} product={product} spotlightLabel={BUSINESS.brandName} />
            <ProductInfo
              product={product}
              familyMap={familyMap}
              purposeMap={purposeMap}
              isAdmin={isAdmin}
              selectedPackLabel={packLabel}
              onSelectPack={setPackLabel}
              qty={qty}
              onQtyChange={setQty}
              priceMeta={priceMeta}
              bulkPackSelected={bulkPackSelected}
              onAddToCart={() => addCurrentSelectionToCart()}
              onBuyNow={() => addCurrentSelectionToCart({ buyNow: true })}
              onContactBulk={() =>
                navigate('/contact', {
                  state: {
                    intent: 'bulk',
                    product: {
                      id: product?._id,
                      name: product?.name,
                      packLabel: packLabel || '',
                      qty,
                      price: priceMeta?.effectivePrice || product?.price,
                    },
                  },
                })
              }
            />
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-[1480px] gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-[rgba(25,33,60,0.08)] bg-white/90 p-5 shadow-[0_22px_60px_rgba(25,33,60,0.07)] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">The Experience</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#19213C]">A fragrance designed to unfold, not rush.</h2>
              <p className="mt-4 text-sm leading-8 text-[#5F6475] sm:text-base">{getExperienceCopy(product, familyMap)}</p>
              <div className="mt-6 rounded-[1.6rem] border border-[rgba(25,33,60,0.08)] bg-[rgba(252,249,243,0.92)] p-4">
                <RichTextContent value={product.description} className="space-y-4 text-sm leading-7 text-[#5F6475]" />
              </div>
            </div>

            {sampleEnabled ? (
              <div className="rounded-[2rem] border border-[rgba(200,169,106,0.22)] bg-[rgba(255,251,243,0.94)] p-5 shadow-[0_22px_60px_rgba(25,33,60,0.05)] sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">Sample first</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-[#19213C]">Try a sample before the full bottle</h3>
                    <p className="mt-2 text-sm leading-7 text-[#5F6475]">
                      {sample.label} available for ₹{Number(sample.price || 0).toLocaleString('en-IN')} if you want to experience the fragrance before placing a larger order.
                    </p>
                  </div>
                  {!isAdmin ? (
                    <button
                      type="button"
                      onClick={() => addCurrentSelectionToCart({ sampleMode: true })}
                      className="rounded-full bg-[linear-gradient(135deg,#E9D28A_0%,#C9A24A_100%)] px-5 py-3 text-sm font-semibold text-[#1B233F] shadow-[0_18px_40px_rgba(196,139,106,0.24)]"
                    >
                      Buy sample
                    </button>
                  ) : null}
                </div>
              </div>
            ) : null}

            <ReviewSection
              product={product}
              isAdmin={isAdmin}
              reviewOpen={reviewOpen}
              onToggleReview={() => setReviewOpen((value) => !value)}
              reviewMessage={reviewMessage}
              hasReviews={hasReviews}
              selectedRating={selectedRating}
              register={register}
              errors={errors}
              setValue={setValue}
              handleSubmit={handleSubmit}
              onSubmit={onSubmit}
            />
          </div>

          <div className="space-y-6 xl:sticky xl:top-[calc(var(--ka-nav-height,88px)+1.5rem)] xl:self-start">
            <ProductAccordion items={accordionItems} defaultOpen={0} />
            <RelatedProducts products={relatedProducts} familyMap={familyMap} />
          </div>
        </div>
      </section>

      <div className="border-t border-[rgba(25,33,60,0.06)] bg-[rgba(255,255,255,0.48)] pt-12 pb-24 md:pb-0">
        <RecentlyViewedStrip excludeId={product?._id} title="Recently viewed" />
      </div>

      {!isAdmin ? (
        <MobileStickyCart
          productId={product._id}
          price={priceMeta?.effectivePrice || product?.price}
          packLabel={packLabel}
          onAddToCart={() => addCurrentSelectionToCart()}
          onBuyNow={() => addCurrentSelectionToCart({ buyNow: true })}
          disabled={bulkPackSelected}
        />
      ) : null}

      <ProductToast open={toast.open} message={toast.message} />
    </div>
  )
}

export default ProductDetail
