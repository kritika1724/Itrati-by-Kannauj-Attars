import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import AdminAssetImage from '../../components/AdminAssetImage'
import AddToCartModal from '../../components/AddToCartModal'
import ProductCard from '../../components/ProductCard'
import { addToCart } from '../../features/cartSlice'
import { api, auth } from '../../services/api'
import { notifyCartItemAdded } from '../../utils/cartLeadPrompt'

function CollectionCatalog({
  collectionKey,
  title,
  lead,
  heroAssetKey,
  membershipField = 'featuredCollections',
  queryParam = 'collection',
  heroFit = 'contain',
}) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = auth.getUser()
  const isAdmin = user?.isAdmin === true

  const [products, setProducts] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [cartModal, setCartModal] = useState({ open: false, product: null })

  const load = async () => {
    try {
      setError('')
      setLoading(true)
      const requests = [
        api.getProducts({ [queryParam]: collectionKey, page: 1, limit: 100, sort: 'newest' }),
      ]
      if (isAdmin) {
        requests.push(api.getProducts({ page: 1, limit: 100, sort: 'name_asc' }))
      }

      const [curatedData, allData] = await Promise.all(requests)
      setProducts(Array.isArray(curatedData) ? curatedData : curatedData.products || [])
      setAllProducts(isAdmin ? (Array.isArray(allData) ? allData : allData?.products || []) : [])
    } catch (err) {
      setError(err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [collectionKey, isAdmin, queryParam])

  const curatedIds = useMemo(() => new Set(products.map((product) => product._id)), [products])
  const availableProducts = useMemo(
    () => allProducts.filter((product) => !curatedIds.has(product._id)),
    [allProducts, curatedIds]
  )

  const toggleMembership = async (product, shouldAdd) => {
    try {
      setBusyId(product._id)
      setError('')
      const current = Array.isArray(product[membershipField]) ? product[membershipField] : []
      const nextCollections = shouldAdd
        ? [...new Set([...current, collectionKey])]
        : current.filter((item) => item !== collectionKey)
      await api.updateProduct(product._id, { [membershipField]: nextCollections })
      await load()
    } catch (err) {
      setError(err.message || 'Request failed')
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="min-h-screen bg-sand">
      <header className="px-6 pb-10 pt-12">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-xs uppercase tracking-[0.35em] text-muted">Collections</p>
          <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">{lead}</p>
        </div>
      </header>

      <section className="px-6 pb-10">
        <div className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
          <AdminAssetImage
            assetKey={heroAssetKey}
            className="aspect-[16/9] w-full rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,rgba(201,162,74,0.16),rgba(255,255,255,0.96),rgba(17,27,58,0.10))]"
            imgClassName="p-2"
            defaultAspect="16 / 9"
            fit={heroFit}
          />
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto w-full max-w-6xl">
          {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-muted">Visible to users</p>
              <h2 className="mt-2 text-2xl font-semibold text-ink">Products in {title}</h2>
            </div>
            <p className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark">
              {products.length} products
            </p>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 text-sm text-muted">Loading collection…</div>
          ) : products.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onView={() => navigate(`/products/${product._id}`)}
                  onAdd={
                    !isAdmin
                      ? ({ mode } = {}) => {
                          if (mode === 'sample') {
                            const sample = product.sample || {}
                            dispatch(
                              addToCart({
                                product: product._id,
                                name: product.name,
                                price: Number(sample.price),
                                image: product.images?.[0] || '',
                                packLabel: sample.label,
                                isSample: true,
                                qty: 1,
                              })
                            )
                            notifyCartItemAdded({ productId: product._id, productName: product.name })
                            navigate('/cart')
                            return
                          }

                          setCartModal({ open: true, product })
                        }
                      : null
                  }
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 text-sm text-muted">
              No products have been added to this collection yet.
            </div>
          )}

          {isAdmin ? (
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-muted">Manage</p>
                    <h3 className="mt-2 text-xl font-semibold text-ink">Products already in {title}</h3>
                  </div>
                  <span className="rounded-full bg-clay px-3 py-1 text-xs font-semibold text-emberDark">
                    {products.length}
                  </span>
                </div>

                <div className="mt-5 grid gap-3">
                  {products.length ? (
                    products.map((product) => (
                      <div
                        key={`in-${product._id}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-clay/50 px-4 py-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-ink">{product.name}</p>
                          <p className="mt-1 text-xs text-muted">{product.category || 'Product'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/products/${product._id}`)}
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark"
                          >
                            Edit product
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleMembership(product, false)}
                            disabled={busyId === product._id}
                            className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
                          >
                            {busyId === product._id ? 'Updating…' : 'Remove'}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted">No products in this collection yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-muted">Available products</p>
                    <h3 className="mt-2 text-xl font-semibold text-ink">Add products to {title}</h3>
                  </div>
                  <span className="rounded-full bg-clay px-3 py-1 text-xs font-semibold text-emberDark">
                    {availableProducts.length}
                  </span>
                </div>

                <div className="mt-5 grid gap-3">
                  {availableProducts.length ? (
                    availableProducts.map((product) => (
                      <div
                        key={`available-${product._id}`}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-clay/50 px-4 py-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-ink">{product.name}</p>
                          <p className="mt-1 text-xs text-muted">{product.category || 'Product'}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/products/${product._id}`)}
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark"
                          >
                            Edit product
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleMembership(product, true)}
                            disabled={busyId === product._id}
                            className="rounded-full bg-ember px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {busyId === product._id ? 'Updating…' : 'Add'}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted">All available products are already added here.</p>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {!isAdmin ? (
        <AddToCartModal
          open={cartModal.open}
          product={cartModal.product}
          onClose={() => setCartModal({ open: false, product: null })}
          onConfirm={({ packLabel, qty, isSample }) => {
            const product = cartModal.product
            if (!product) return
            const packs = Array.isArray(product.packs) ? product.packs : []
            const chosen = packLabel ? packs.find((item) => (item.label || '').trim() === packLabel) : null
            const sample = product.sample || {}
            const regularPrice = Number(chosen?.price)
            const salePrice = chosen?.salePrice === null || chosen?.salePrice === undefined || chosen?.salePrice === '' ? null : Number(chosen?.salePrice)
            const price = isSample
              ? Number(sample.price)
              : chosen && Number.isFinite(salePrice) && salePrice > 0 && Number.isFinite(regularPrice) && salePrice < regularPrice
                ? salePrice
                : chosen
                  ? regularPrice
                  : product.price

            dispatch(
              addToCart({
                product: product._id,
                name: product.name,
                price,
                image: product.images?.[0] || '',
                packLabel: isSample ? sample.label : packs.length ? packLabel : '',
                isSample: isSample === true,
                qty,
              })
            )
            notifyCartItemAdded({ productId: product._id, productName: product.name })
            setCartModal({ open: false, product: null })
            navigate('/cart')
          }}
        />
      ) : null}
    </div>
  )
}

export default CollectionCatalog
