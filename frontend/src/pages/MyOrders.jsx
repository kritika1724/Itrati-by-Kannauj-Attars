import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
  return map[status] || status
}

function MyOrders() {
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getMyOrders()
        setOrders(data || [])
      } catch (err) {
        setError(err.message)
      }
    }
    load()
  }, [])

  return (
    <div className="bg-sand min-h-screen">
      <header className="px-6 pb-10 pt-12">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-xs uppercase tracking-[0.35em] text-muted">Account</p>
          <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">My orders</h1>
          <p className="mt-3 text-sm text-muted">Track your purchases and delivery status.</p>
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto w-full max-w-6xl">
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
            {orders.length === 0 ? (
              <div>
                <p className="text-sm text-muted">No orders yet.</p>
                <Link
                  to="/products"
                  className="mt-5 inline-flex rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white transition hover:bg-emberDark"
                >
                  Explore products
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <Link
                    key={order._id}
                    to={`/order/${order._id}`}
                    className="group rounded-2xl border border-slate-200/80 bg-clay/60 p-5 transition hover:-translate-y-0.5 hover:border-gold/40 hover:bg-clay/75 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.28em] text-muted">Order ID</p>
                        <p className="mt-1 text-sm font-semibold text-ink">{order.publicOrderId || order._id}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.28em] text-muted">Total</p>
                        <p className="mt-1 text-sm font-semibold text-ink">₹{order.totalPrice}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-muted">
                        {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                      </p>
                      <span className="rounded-full border border-gold/25 bg-white px-3 py-1 text-xs font-semibold text-emberDark">
                        {statusLabel(order.status)}
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-emberDark opacity-0 transition group-hover:opacity-100">
                      View details →
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default MyOrders
