import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../services/api'
import { clearCart } from '../../features/cartSlice'
import { auth } from '../../services/api'
import { useEffect, useMemo } from 'react'
import { openRazorpayCheckout } from '../../utils/razorpay'
import { saveLastOrder } from '../../utils/orderStorage'
import { BUSINESS } from '../../config/business'

function PlaceOrder() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = auth.getUser()

  const { items, shippingAddress, paymentMethod } = useSelector((state) => state.cart)

  const COD_LIMIT = 2000
  const itemsPrice = useMemo(() => items.reduce((sum, item) => sum + item.qty * item.price, 0), [items])
  const shippingPrice = 0
  const taxPrice = 0
  const totalPrice = itemsPrice + shippingPrice + taxPrice

  useEffect(() => {
    if ((paymentMethod || 'COD').toUpperCase() === 'COD' && totalPrice > COD_LIMIT) {
      navigate('/checkout/payment', { replace: true })
    }
  }, [paymentMethod, totalPrice, navigate])

  useEffect(() => {
    const required = [
      shippingAddress?.fullName,
      shippingAddress?.email,
      shippingAddress?.phone,
      shippingAddress?.whatsapp,
      shippingAddress?.addressLine1,
      shippingAddress?.city,
      shippingAddress?.state,
      shippingAddress?.postalCode,
      shippingAddress?.country,
    ]
    if (required.some((value) => !String(value || '').trim())) {
      navigate('/checkout/shipping', { replace: true })
    }
  }, [shippingAddress, navigate])

  const payWithRazorpay = async (order) => {
    const rzp = await api.createRazorpayOrder(order._id)

    await openRazorpayCheckout({
      key: rzp.keyId,
      razorpayOrderId: rzp.razorpayOrderId,
      amount: rzp.amount,
      currency: rzp.currency,
      name: BUSINESS.fullDisplayName,
      description: `Order ${order.publicOrderId || order._id}`,
      prefill: {
        name: shippingAddress?.fullName || user?.name || '',
        email: shippingAddress?.email || user?.email || '',
        contact: shippingAddress?.whatsapp || shippingAddress?.phone || '',
      },
      themeColor: '#111B3A',
      onSuccess: async (response) => {
        try {
          const updated = await api.verifyRazorpayPayment({
            orderId: order._id,
            ...response,
          })
          saveLastOrder(updated)
          dispatch(clearCart())
          navigate(`/checkout/success/${updated._id}`)
        } catch (e) {
          navigate(`/checkout/failure/${order._id}`)
        }
      },
      onDismiss: () => {
        navigate(`/checkout/failure/${order._id}`)
      },
    })
  }

  const placeOrder = async () => {
    const payload = {
      orderItems: items.map((i) => ({
        product: i.product,
        qty: i.qty,
        packLabel: i.packLabel || '',
        isSample: i.isSample === true,
      })),
      shippingAddress,
      paymentMethod,
    }

    const method = String(paymentMethod || 'COD').toUpperCase()
    const order = await api.createOrder(payload)
    saveLastOrder(order)

    if (method === 'RAZORPAY') {
      // Keep cart until payment success; user can retry if needed.
      await payWithRazorpay(order)
      return
    }

    dispatch(clearCart())
    navigate(`/checkout/success/${order._id}`)
  }

  return (
    <div className="bg-sand min-h-screen">
      <header className="px-6 pb-10 pt-12">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-xs uppercase tracking-[0.35em] text-muted">Checkout</p>
          <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">Place order</h1>
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
              <h2 className="text-lg font-semibold text-ink">Shipping</h2>
              <p className="mt-3 text-sm text-muted">
                {shippingAddress.fullName}, {shippingAddress.phone}
                <br />
                WhatsApp: {shippingAddress.whatsapp}
                <br />
                {shippingAddress.email}
                <br />
                {shippingAddress.addressLine1}
                {shippingAddress.addressLine2 ? `, ${shippingAddress.addressLine2}` : ''}
                <br />
                {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}
                <br />
                {shippingAddress.country}
              </p>
              <Link to="/checkout/shipping" className="mt-4 inline-flex text-sm font-semibold text-emberDark">
                Edit
              </Link>
            </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
            <h2 className="text-lg font-semibold text-ink">Payment</h2>
              <p className="mt-3 text-sm text-muted">{paymentMethod}</p>
              {(paymentMethod || 'COD').toUpperCase() === 'COD' && totalPrice > COD_LIMIT ? (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  COD not available above ₹{COD_LIMIT}. Please choose online payment.
                </p>
              ) : null}
              <Link to="/checkout/payment" className="mt-4 inline-flex text-sm font-semibold text-emberDark">
                Edit
              </Link>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
              <h2 className="text-lg font-semibold text-ink">Items</h2>
              <div className="mt-4 grid gap-3">
                {items.map((item) => (
                  <div
                    key={`${item.product}-${item.packLabel || 'default'}-${item.isSample ? 'sample' : 'regular'}`}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-clay/70 p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink">{item.name}</p>
                      <p className="mt-1 text-xs text-muted">
                        Qty: {item.qty}
                        {item.packLabel ? ` • ${item.isSample ? 'Sample' : 'Pack'}: ${item.packLabel}` : ''}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-ink">₹{item.qty * item.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
            <h2 className="text-lg font-semibold text-ink">Order summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Items</span>
                <span className="font-semibold text-ink">₹{itemsPrice}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Shipping</span>
                <span className="font-semibold text-ink">₹{shippingPrice}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Tax</span>
                <span className="font-semibold text-ink">₹{taxPrice}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-200/80 pt-3">
                <span className="text-muted">Total</span>
                <span className="text-lg font-semibold text-ink">₹{totalPrice}</span>
              </div>
            </div>

            <button
              onClick={placeOrder}
              disabled={items.length === 0}
              className="mt-6 w-full rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {(paymentMethod || 'COD').toUpperCase() === 'RAZORPAY' ? 'Pay now' : 'Place order'}
            </button>
            <p className="mt-3 text-xs text-muted">We will use your checkout details to confirm the order.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PlaceOrder
