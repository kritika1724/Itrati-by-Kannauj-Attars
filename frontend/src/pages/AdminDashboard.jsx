import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [actionId, setActionId] = useState('')

  const load = async () => {
    try {
      setError('')
      const data = await api.adminStats()
      setStats(data)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
    const id = window.setInterval(load, 15000)
    return () => window.clearInterval(id)
  }, [])

  const removeOrder = async (id) => {
    const ok = window.confirm('Delete this order permanently?')
    if (!ok) return

    try {
      setActionId(`order-${id}`)
      await api.deleteOrder(id)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionId('')
    }
  }

  const removeContact = async (id) => {
    const ok = window.confirm('Delete this contact request?')
    if (!ok) return

    try {
      setActionId(`contact-${id}`)
      await api.deleteContactMessage(id)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setActionId('')
    }
  }

  return (
    <div className="bg-sand min-h-screen">
      <header className="px-6 pb-10 pt-12">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-muted">Admin</p>
            <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">Dashboard</h1>
            <p className="mt-3 text-sm text-muted">Orders, products, and website overview.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/products"
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-emberDark hover:border-gold/40"
            >
              Products
            </Link>
            <Link
              to="/admin/contacts"
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-emberDark hover:border-gold/40"
            >
              <span className="inline-flex items-center gap-2">
                Contacts
                {Number(stats?.newContactMessages || 0) > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                    NEW {stats.newContactMessages}
                  </span>
                ) : null}
              </span>
            </Link>
            <Link
              to="/admin/media"
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-emberDark hover:border-gold/40"
            >
              Website Images
            </Link>
            <Link
              to="/admin/filters"
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-emberDark hover:border-gold/40"
            >
              Filters
            </Link>
            <Link
              to="/admin/fragrance-club"
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-emberDark hover:border-gold/40"
            >
              Fragrance Club
            </Link>
            <Link
              to="/admin/orders"
              className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white transition hover:bg-emberDark"
            >
              <span className="inline-flex items-center gap-2">
                Orders
                {Number(stats?.newOrders || 0) > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-emberDark">
                    NEW {stats.newOrders}
                  </span>
                ) : null}
              </span>
            </Link>
          </div>
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto w-full max-w-6xl">
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Products', value: stats?.products ?? '—', sticker: stats?.lowStockCount, stickerLabel: 'low stock' },
              { label: 'Orders', value: stats?.orders ?? '—', sticker: stats?.newOrders },
              { label: 'Contacts', value: stats?.contactMessages ?? '—', sticker: stats?.newContactMessages },
              { label: 'Fragrance Club', value: stats?.fragranceClubMembers ?? '—', to: '/admin/fragrance-club' },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10"
              >
                <p className="text-xs uppercase tracking-[0.35em] text-muted">{card.label}</p>
                <p className="mt-4 font-display text-4xl text-ink">{card.value}</p>
                {Number(card.sticker || 0) > 0 ? (
                  <p className="mt-3 inline-flex rounded-full bg-red-600 px-3 py-1 text-[11px] font-semibold text-white">
                    {card.sticker} {card.stickerLabel || 'new'}
                  </p>
                ) : null}
                <div className="mt-6 h-px w-full bg-[linear-gradient(90deg,rgba(201,162,74,0.45),rgba(201,162,74,0))]" />
                {card.to ? (
                  <Link
                    to={card.to}
                    className="mt-4 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark hover:border-gold/40"
                  >
                    View members
                  </Link>
                ) : (
                  <p className="mt-4 text-sm text-muted">Updated live from the database.</p>
                )}
              </div>
            ))}
          </div>

          {Number(stats?.lowStockCount || 0) > 0 ? (
            <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-red-600">Inventory alert</p>
                  <h2 className="mt-2 text-xl font-semibold text-ink">Products at 5 or fewer in stock</h2>
                  <p className="mt-2 text-sm text-muted">
                    Update these products soon so new orders do not run into stock issues.
                  </p>
                </div>
                <Link
                  to="/admin/products"
                  className="rounded-full border border-red-200 bg-white px-5 py-2 text-sm font-semibold text-red-600 hover:border-red-300"
                >
                  Open products
                </Link>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {(stats?.lowStockProducts || []).map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-white p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">{product.name}</p>
                      <p className="mt-1 text-xs text-muted">{product.category || 'Product'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-600">
                        {Number(product.stock || 0) === 0 ? 'Out of stock' : `${product.stock} left`}
                      </p>
                      <Link
                        to={`/admin/products/${product._id}`}
                        className="mt-2 inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-emberDark hover:border-gold/40"
                      >
                        Update stock
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-muted">Recent</p>
                  <h2 className="mt-2 text-xl font-semibold text-ink">Latest orders</h2>
                </div>
                <Link
                  to="/admin/orders"
                  className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-emberDark hover:border-gold/40"
                >
                  View all
                </Link>
              </div>

              <div className="mt-6 grid gap-3">
                {(stats?.recentOrders || []).map((order) => (
                  <div
                    key={order._id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-clay/60 p-4"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-muted">Order ID</p>
                      <p className="text-sm font-semibold text-ink">{order.publicOrderId || order._id}</p>
                      <p className="mt-1 text-xs text-muted">
                        {order.user?.name
                          ? `${order.user.name} • `
                          : order.shippingAddress?.fullName
                            ? `${order.shippingAddress.fullName} • `
                            : ''}
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink">₹{order.totalPrice}</p>
                      <p className="mt-1 text-xs text-muted">{order.status}</p>
                      <button
                        type="button"
                        onClick={() => removeOrder(order._id)}
                        disabled={actionId === `order-${order._id}`}
                        className="mt-3 rounded-full border border-red-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-red-600 disabled:opacity-50"
                      >
                        {actionId === `order-${order._id}` ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}

                {stats && (stats.recentOrders || []).length === 0 && (
                  <p className="text-sm text-muted">No orders yet.</p>
                )}
                {!stats && !error && <p className="text-sm text-muted">Loading stats…</p>}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-muted">Inbox</p>
                  <h2 className="mt-2 text-xl font-semibold text-ink">Latest contact requests</h2>
                </div>
                <Link
                  to="/admin/contacts"
                  className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-emberDark hover:border-gold/40"
                >
                  View all
                </Link>
              </div>

              <div className="mt-6 grid gap-3">
                {(stats?.recentContactMessages || []).map((m) => (
                  <div
                    key={m._id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-clay/60 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">{m.name}</p>
                      <p className="mt-1 text-xs text-muted">{m.email}</p>
                      <p className="mt-1 text-xs text-muted">
                        {m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-emberDark">{m.status || 'new'}</p>
                      <button
                        type="button"
                        onClick={() => removeContact(m._id)}
                        disabled={actionId === `contact-${m._id}`}
                        className="mt-3 rounded-full border border-red-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-red-600 disabled:opacity-50"
                      >
                        {actionId === `contact-${m._id}` ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}

                {stats && (stats.recentContactMessages || []).length === 0 && (
                  <p className="text-sm text-muted">No messages yet.</p>
                )}
                {!stats && !error && <p className="text-sm text-muted">Loading inbox…</p>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
