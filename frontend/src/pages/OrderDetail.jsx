import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, auth } from '../services/api'
import { toAssetUrl } from '../utils/media'
import { openRazorpayCheckout } from '../utils/razorpay'
import { BUSINESS } from '../config/business'

const statusLabel = (status) => {
  const map = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }
  return map[status] || status
}

function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState('')
  const [canceling, setCanceling] = useState(false)
  const [cancelMessage, setCancelMessage] = useState('')
  const user = auth.getUser()
  const isAdmin = user?.isAdmin === true

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getOrder(id)
        setOrder(data)
      } catch (err) {
        setError(err.message)
      }
    }
    load()
  }, [id])

  const address = order?.shippingAddress
  const formattedAddress = useMemo(() => {
    if (!address) return ''
    return [
      `${address.fullName} (${address.phone})`,
      address.whatsapp ? `WhatsApp: ${address.whatsapp}` : '',
      address.email || '',
      address.addressLine1 + (address.addressLine2 ? `, ${address.addressLine2}` : ''),
      `${address.city}, ${address.state} ${address.postalCode}`,
      address.country,
    ].join('\n')
  }, [address])

  if (error) {
    return (
      <div className="bg-sand min-h-screen px-6 py-16">
        <div className="mx-auto w-full max-w-4xl rounded-3xl border border-red-200 bg-white p-8">
          <p className="text-sm font-semibold text-red-600">{error}</p>
          <Link
            to={isAdmin ? '/admin/orders' : '/account/orders'}
            className="mt-4 inline-flex text-sm font-semibold text-emberDark"
          >
            {isAdmin ? 'Back to admin orders' : 'Back to my orders'}
          </Link>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="bg-sand min-h-screen px-6 py-16">
        <p className="mx-auto w-full max-w-6xl text-sm text-muted">Loading order…</p>
      </div>
    )
  }

  const canPayNow =
    !isAdmin && (order.paymentMethod || '').toUpperCase() === 'RAZORPAY' && !order.isPaid
  const canCancel = user?.isAdmin !== true && order.status === 'pending'

  return (
    <div className="bg-sand min-h-screen">
      <header className="px-6 pb-10 pt-12">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-xs uppercase tracking-[0.35em] text-muted">Order</p>
          <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">Order details</h1>
          <p className="mt-3 text-sm text-muted">
            Order ID: <span className="font-semibold text-ink">{order.publicOrderId || order._id}</span>
            {order.createdAt ? ` • ${new Date(order.createdAt).toLocaleString()}` : ''}
          </p>
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
              <h2 className="text-lg font-semibold text-ink">Shipping</h2>
              <pre className="mt-3 whitespace-pre-wrap rounded-2xl border border-slate-200/80 bg-clay/60 p-4 text-sm text-ink">
                {formattedAddress}
              </pre>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
              <h2 className="text-lg font-semibold text-ink">Items</h2>
              <div className="mt-4 grid gap-4">
                {order.orderItems?.map((item) => (
                  <div
                    key={`${order._id}-${item.product}-${item.pack?.label || ''}`}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-clay/60 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        {item.image ? (
                          <img
                            src={toAssetUrl(item.image, import.meta.env.VITE_API_ASSET)}
                            alt={item.name}
                            className="h-full w-full bg-white object-contain p-1"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full bg-[linear-gradient(135deg,rgba(201,162,74,0.18),rgba(255,255,255,0.85),rgba(17,27,58,0.10))]" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">{item.name}</p>
                        <p className="mt-1 text-xs text-muted">
                          Qty: {item.qty} • ₹{item.price}
                          {item.pack?.label ? ` • ${item.sample ? 'Sample' : 'Pack'}: ${item.pack.label}` : ''}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-ink">₹{item.qty * item.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
            <h2 className="text-lg font-semibold text-ink">Summary</h2>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-muted">Status</span>
              <span className="rounded-full border border-gold/25 bg-clay/50 px-3 py-1 text-xs font-semibold text-emberDark">
                {statusLabel(order.status)}
              </span>
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Items</span>
                <span className="font-semibold text-ink">₹{order.itemsPrice}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Shipping</span>
                <span className="font-semibold text-ink">₹{order.shippingPrice}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Tax</span>
                <span className="font-semibold text-ink">₹{order.taxPrice}</span>
              </div>
              {Number(order.discountAmount || 0) > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted">
                    Discount{order.discountCode ? ` (${order.discountCode})` : ''}
                  </span>
                  <span className="font-semibold text-[#1F7A45]">-₹{order.discountAmount}</span>
                </div>
              ) : null}
              <div className="mt-2 flex items-center justify-between border-t border-slate-200/80 pt-3">
                <span className="text-muted">Total</span>
                <span className="text-lg font-semibold text-ink">₹{order.totalPrice}</span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-gold/20 bg-[radial-gradient(circle_at_top,rgba(201,162,74,0.18),rgba(255,255,255,0.92))] p-4">
              <p className="text-sm font-semibold text-ink">Payment</p>
              <p className="mt-1 text-sm text-muted">
                Method: <span className="font-semibold text-ink">{order.paymentMethod}</span>
              </p>
              <p className="mt-1 text-sm text-muted">
                Status:{' '}
                <span className="font-semibold text-ink">{order.isPaid ? 'Paid' : 'Not paid'}</span>
              </p>
              {order.discountCode ? (
                <p className="mt-1 text-sm text-muted">
                  Coupon: <span className="font-semibold text-ink">{order.discountCode}</span>
                </p>
              ) : null}
              {order.paymentMethod === 'COD' && !order.isPaid && (
                <p className="mt-2 text-xs text-muted">
                  Cash on Delivery: pay at the time of delivery.
                </p>
              )}

              {canPayNow ? (
                <div className="mt-4">
                  {payError ? <p className="mb-3 text-xs font-semibold text-red-600">{payError}</p> : null}
                  <button
                    type="button"
                    disabled={paying}
                    onClick={async () => {
                      setPaying(true)
                      setPayError('')
                      try {
                        const rzp = await api.createRazorpayOrder(order._id)
                        await openRazorpayCheckout({
                          key: rzp.keyId,
                          razorpayOrderId: rzp.razorpayOrderId,
                          amount: rzp.amount,
                          currency: rzp.currency,
                          name: BUSINESS.fullDisplayName,
                          description: `Order ${order.publicOrderId || order._id}`,
                          prefill: {
                            name: order?.shippingAddress?.fullName || user?.name || '',
                            email: user?.email || '',
                            contact: order?.shippingAddress?.whatsapp || order?.shippingAddress?.phone || '',
                          },
                          themeColor: '#111B3A',
                          onSuccess: async (response) => {
                            await api.verifyRazorpayPayment({ orderId: order._id, ...response })
                            const refreshed = await api.getOrder(order._id)
                            setOrder(refreshed)
                          },
                          onDismiss: () => {
                            setPayError('Payment cancelled. You can retry anytime.')
                          },
                        })
                      } catch (e) {
                        setPayError(e.message)
                      } finally {
                        setPaying(false)
                      }
                    }}
                    className="w-full rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white transition hover:bg-emberDark disabled:opacity-60"
                  >
                    {paying ? 'Opening payment…' : 'Pay now'}
                  </button>
                </div>
              ) : null}
            </div>

            {canCancel ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-white p-4">
                <p className="text-sm font-semibold text-ink">Cancel order</p>
                <p className="mt-2 text-sm text-muted">
                  You can cancel this order only before admin confirms it. Once cancelled, the admin panel will update automatically.
                </p>
                {cancelMessage ? (
                  <p className="mt-3 text-xs font-semibold text-emberDark">{cancelMessage}</p>
                ) : null}
                <button
                  type="button"
                  disabled={canceling}
                  onClick={async () => {
                    const ok = window.confirm('Cancel this order?')
                    if (!ok) return
                    setCanceling(true)
                    setCancelMessage('')
                    try {
                      const updated = await api.cancelOrder(order._id)
                      setOrder(updated)
                      setCancelMessage('Order cancelled.')
                    } catch (e) {
                      setCancelMessage(e.message || 'Request failed')
                    } finally {
                      setCanceling(false)
                    }
                  }}
                  className="mt-4 w-full rounded-full border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:border-red-300 disabled:opacity-60"
                >
                  {canceling ? 'Cancelling…' : 'Cancel order'}
                </button>
              </div>
            ) : null}

            <Link
              to={isAdmin ? '/admin/orders' : '/account/orders'}
              className="mt-6 inline-flex w-full justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-emberDark"
            >
              {isAdmin ? 'Back to admin orders' : 'Back to my orders'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default OrderDetail
