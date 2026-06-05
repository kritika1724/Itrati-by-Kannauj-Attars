import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

function AdminProducts() {
  const [products, setProducts] = useState([])
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [keyword, setKeyword] = useState('')

  const loadProducts = async () => {
    try {
      const data = await api.getProducts({ page, limit: 24, sort: 'newest', keyword })
      const list = Array.isArray(data) ? data : data.products || []
      setProducts(list)
      setPages(Array.isArray(data) ? 1 : data.pages || 1)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [page, keyword])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return
    try {
      await api.deleteProduct(id)
      await loadProducts()
    } catch (err) {
      setError(err.message)
    }
  }

  const toggleBestSeller = async (product) => {
    setBusyId(product._id)
    setError('')
    try {
      await api.updateProduct(product._id, { isBestSeller: product.isBestSeller !== true })
      await loadProducts()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyId('')
    }
  }

  return (
    <div className="bg-sand min-h-screen">
      <header className="px-6 pb-10 pt-12">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted">Admin</p>
            <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">Product Dashboard</h1>
          </div>
          <Link
            to="/admin/products/new"
            className="rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white"
          >
            Add product
          </Link>
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              value={keyword}
              onChange={(e) => {
                setPage(1)
                setKeyword(e.target.value)
              }}
              placeholder="Search products…"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
            />
            <div className="flex items-center justify-between gap-2 md:justify-end">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark disabled:opacity-50"
              >
                Prev
              </button>
              <p className="text-xs font-semibold text-muted">
                Page {page} / {pages}
              </p>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            {products.map((product) => (
              <div
                key={product._id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ember/10 bg-clay/70 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{product.name}</p>
                  <p className="text-xs text-muted">₹{product.price}</p>
                  <p className="mt-1 text-xs font-semibold text-emberDark">Stock: {product.stock ?? 0}</p>
                  {product.isBestSeller ? (
                    <span className="mt-2 inline-flex rounded-full bg-gold px-3 py-1 text-[11px] font-semibold text-midnight">
                      Best seller
                    </span>
                  ) : null}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={busyId === product._id}
                    onClick={() => toggleBestSeller(product)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition disabled:opacity-60 ${
                      product.isBestSeller
                        ? 'border border-gold/40 bg-white text-emberDark hover:border-gold'
                        : 'border border-slate-200 bg-white text-emberDark hover:border-gold/40'
                    }`}
                    title="Toggle best seller"
                  >
                    {busyId === product._id
                      ? 'Saving…'
                      : product.isBestSeller
                        ? 'Remove best seller'
                        : 'Mark best seller'}
                  </button>
                  <Link
                    to={`/admin/products/${product._id}`}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark hover:border-ember/40"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(product._id)}
                    className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:border-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-sm text-muted">No products yet. Add your first product.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminProducts
