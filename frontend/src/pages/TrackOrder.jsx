import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiSearch, FiPackage, FiClock, FiCheckCircle } from 'react-icons/fi'
import { api } from '../services/api'

const statusLabel = (status) => {
  const map = {
    payment_pending: 'Payment pending',
    pending: 'Pending',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  return map[status] || status || 'Pending'
}

function TrackOrder() {
  const [publicOrderId, setPublicOrderId] = useState('')
  const [contact, setContact] = useState('')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const loadOrder = async (e) => {
    if (e?.preventDefault) e.preventDefault()
    const nextOrderId = publicOrderId.trim().toUpperCase()
    const sameLookup = order?.publicOrderId === nextOrderId
    setLoading(true)
    setError('')
    setMessage('')
    if (!sameLookup) setOrder(null)

    try {
      const data = await api.trackOrder(nextOrderId, contact.trim())
      setOrder(data)
    } catch (err) {
      setError(err.message || 'Unable to track this order.')
    } finally {
      setLoading(false)
    }
  }

  const canCancel = order?.status === 'pending'

  const cancelOrder = async () => {
    const ok = window.confirm('Cancel this order?')
    if (!ok) return

    setCanceling(true)
    setError('')
    setMessage('')
    try {
      const updated = await api.cancelTrackedOrder(publicOrderId.trim().toUpperCase(), contact.trim())
      setOrder(updated)
      setMessage('Order cancelled successfully.')
    } catch (err) {
      setError(err.message || 'Unable to cancel this order.')
    } finally {
      setCanceling(false)
    }
  }

  return (
    <div className="min-h-screen bg-sand">
      <header className="px-6 pb-10 pt-12">
        <div className="mx-auto w-full max-w-5xl">
          <p className="ka-kicker">Orders</p>
          <h1 className="mt-3 ka-h1">Track your order</h1>
          <p className="mt-4 ka-lead">
            Enter your order ID and the WhatsApp number used at checkout.
          </p>
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-black/10">
            <form onSubmit={loadOrder} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-ink">Order ID</label>
                <input
                  value={publicOrderId}
                  onChange={(e) => setPublicOrderId(e.target.value.toUpperCase())}
                  placeholder="Enter your order ID"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">WhatsApp number</label>
                <input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="+91XXXXXXXXXX"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !publicOrderId.trim() || !contact.trim()}
                className="inline-flex items-center gap-2 rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white transition hover:bg-emberDark disabled:opacity-60"
              >
                <FiSearch />
                {loading ? 'Checking…' : 'Track order'}
              </button>
            </form>

            <div className="mt-8 rounded-2xl border border-slate-200/80 bg-clay/50 p-5">
              <p className="text-sm font-semibold text-ink">How it works</p>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>Use the order ID shown after checkout.</li>
                <li>Enter the same WhatsApp number used while placing the order.</li>
                <li>You will see order status, payment status, and order details.</li>
              </ul>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-black/10">
            {!order && !error ? (
              <div>
                <h2 className="text-xl font-semibold text-ink">Order status will appear here</h2>
                <p className="mt-3 text-sm text-muted">
                  After entering the correct details, we will show the latest order update.
                </p>
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm font-semibold text-red-600">{error}</p>
              </div>
            ) : null}

            {message ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-sm font-semibold text-emerald-700">{message}</p>
              </div>
            ) : null}

            {order ? (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-muted">Order ID</p>
                    <p className="mt-2 text-2xl font-semibold text-ink">{order.publicOrderId}</p>
                    <p className="mt-2 text-sm text-muted">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                    </p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                      Latest admin status
                    </p>
                  </div>
                  <div className="rounded-full border border-gold/25 bg-clay/50 px-4 py-2 text-sm font-semibold text-emberDark">
                    {statusLabel(order.status)}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-clay/40 p-4">
                  <p className="text-sm text-muted">
                    This status is synced with the admin dashboard.
                    {order.updatedAt ? ` Last updated: ${new Date(order.updatedAt).toLocaleString()}` : ''}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {canCancel ? (
                      <button
                        type="button"
                        onClick={cancelOrder}
                        disabled={canceling || loading}
                        className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300 disabled:opacity-60"
                      >
                        {canceling ? 'Cancelling…' : 'Cancel order'}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={loadOrder}
                      disabled={loading || canceling}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark transition hover:border-gold/40 disabled:opacity-60"
                    >
                      {loading ? 'Refreshing…' : 'Refresh status'}
                    </button>
                  </div>
                </div>

                {canCancel ? (
                  <p className="mt-3 text-xs text-muted">
                    You can cancel this order only before it is confirmed by admin.
                  </p>
                ) : null}

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200/80 bg-clay/50 p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-muted">Payment</p>
                    <p className="mt-2 text-sm font-semibold text-ink">{order.paymentMethod}</p>
                    <p className="mt-1 text-sm text-muted">
                      {order.isPaid ? 'Paid' : 'Awaiting payment'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 bg-clay/50 p-4">
                    <p className="text-xs uppercase tracking-[0.28em] text-muted">Total</p>
                    <p className="mt-2 text-sm font-semibold text-ink">₹{order.totalPrice}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200/80 bg-clay/50 p-4">
                  <p className="text-sm font-semibold text-ink">Shipping to</p>
                  <p className="mt-2 text-sm text-muted">
                    {order.shippingAddress?.fullName}
                    <br />
                    {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
                    {order.shippingAddress?.postalCode}
                    <br />
                    {order.shippingAddress?.country}
                  </p>
                </div>

                <div className="mt-6">
                  <div className="mb-3 flex items-center gap-2">
                    <FiPackage className="text-ember" />
                    <h2 className="text-lg font-semibold text-ink">Items</h2>
                  </div>
                  <div className="grid gap-3">
                    {(order.orderItems || []).map((item, index) => (
                      <div
                        key={`${item.product || item.name}-${index}`}
                        className="rounded-2xl border border-slate-200/80 bg-clay/50 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-ink">{item.name}</p>
                            <p className="mt-1 text-xs text-muted">
                              Qty: {item.qty}
                              {item.pack?.label ? ` • ${item.sample ? 'Sample' : 'Pack'}: ${item.pack.label}` : ''}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-ink">₹{item.qty * item.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/contact"
                    className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-emberDark hover:border-gold/40"
                  >
                    Need help?
                  </Link>
                  <Link
                    to="/products"
                    className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white transition hover:bg-emberDark"
                  >
                    Shop more
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto grid w-full max-w-5xl gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <FiClock className="text-ember" size={18} />
            <p className="mt-3 text-sm font-semibold text-ink">Pending / Confirmed</p>
            <p className="mt-2 text-sm text-muted">Your order is received and being prepared.</p>
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <FiPackage className="text-ember" size={18} />
            <p className="mt-3 text-sm font-semibold text-ink">Shipped</p>
            <p className="mt-2 text-sm text-muted">Your package has left us and is on the way.</p>
          </div>
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <FiCheckCircle className="text-ember" size={18} />
            <p className="mt-3 text-sm font-semibold text-ink">Delivered</p>
            <p className="mt-2 text-sm text-muted">Your order has been completed successfully.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default TrackOrder
