import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, auth } from '../../services/api'
import { openRazorpayCheckout } from '../../utils/razorpay'
import { getLastOrderById, saveLastOrder } from '../../utils/orderStorage'
import { BUSINESS } from '../../config/business'

function PaymentFailure() {
  const { id } = useParams()
  const [order, setOrder] = useState(() => getLastOrderById(id))
  const [message, setMessage] = useState('Payment was not completed.')
  const user = auth.getUser()
  const orderId = order?.publicOrderId || id

  useEffect(() => {
    const localOrder = getLastOrderById(id)
    if (localOrder) {
      setOrder(localOrder)
      return
    }

    if (!user) {
      setMessage('Payment was not completed. You can retry from this page.')
      return
    }

    ;(async () => {
      try {
        const data = await api.getOrder(id)
        setOrder(data)
      } catch (e) {
        setMessage(e.message)
      }
    })()
  }, [id, user])

  const retry = async () => {
    if (!order) return
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
          email: order?.shippingAddress?.email || user?.email || '',
          contact: order?.shippingAddress?.whatsapp || order?.shippingAddress?.phone || '',
        },
        themeColor: '#111B3A',
        onSuccess: async (response) => {
          const updated = await api.verifyRazorpayPayment({ orderId: order._id, ...response })
          saveLastOrder(updated)
          window.location.href = `/checkout/success/${order._id}`
        },
        onDismiss: () => {
          setMessage('Payment cancelled. You can retry anytime.')
        },
      })
    } catch (e) {
      setMessage(e.message)
    }
  }

  return (
    <div className="min-h-screen bg-sand px-6 py-16">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-slate-200/80 bg-white p-10 shadow-lg shadow-black/10">
        <p className="text-xs uppercase tracking-[0.35em] text-muted">Payment</p>
        <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">Payment not completed</h1>
        <p className="mt-4 text-sm text-muted">{message}</p>

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-clay/50 p-4 text-sm text-ink">
          Order ID: <span className="font-semibold">{orderId}</span>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={retry}
            disabled={!order || order?.isPaid}
            className="rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white transition hover:bg-emberDark disabled:opacity-60"
          >
            Retry payment
          </button>
          {user ? (
            <Link
              to={`/order/${id}`}
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-emberDark hover:border-gold/40"
          >
            View order
          </Link>
          ) : null}
          <Link
            to="/track-order"
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-emberDark hover:border-gold/40"
          >
            Track order
          </Link>
          <Link
            to="/products"
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-emberDark hover:border-gold/40"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PaymentFailure
