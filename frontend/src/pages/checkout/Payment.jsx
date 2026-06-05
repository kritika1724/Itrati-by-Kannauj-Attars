import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { savePaymentMethod } from '../../features/cartSlice'
import { getCartTotals, isWelcomeCouponActive, WELCOME_COUPON_CODE } from '../../utils/cartOffers'

function Payment() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { paymentMethod, items, coupon } = useSelector((state) => state.cart)

  const COD_LIMIT = 2000
  const itemsPrice = useMemo(() => items.reduce((sum, item) => sum + item.qty * item.price, 0), [items])
  const { discountAmount, totalPrice } = getCartTotals({ itemsPrice, coupon })
  const rewardActive = isWelcomeCouponActive(coupon)
  const codAllowed = totalPrice <= COD_LIMIT

  const [selected, setSelected] = useState(paymentMethod || 'COD')

  useEffect(() => {
    if (!codAllowed) setSelected('RAZORPAY')
  }, [codAllowed])

  const onContinue = () => {
    dispatch(savePaymentMethod(selected || 'COD'))
    navigate('/checkout/place-order')
  }

  return (
    <div className="bg-sand min-h-screen">
      <header className="px-6 pb-10 pt-12">
        <div className="mx-auto w-full max-w-4xl">
          <p className="text-xs uppercase tracking-[0.35em] text-muted">Checkout</p>
          <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">Payment</h1>
          <p className="mt-3 text-sm text-muted">
            Choose your payment method. COD is available only up to ₹{COD_LIMIT}.
          </p>
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200/80 bg-white p-8 shadow-lg shadow-black/10">
          <div className="grid gap-4">
            <div className={`rounded-2xl border border-gold/25 p-5 ${codAllowed ? 'bg-clay/60' : 'bg-slate-50 opacity-70'}`}>
              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  disabled={!codAllowed}
                  checked={selected === 'COD'}
                  onChange={() => setSelected('COD')}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-semibold text-ink">Cash on Delivery (COD)</p>
                  <p className="text-xs text-muted">Pay when your order is delivered.</p>
                  {!codAllowed ? (
                    <p className="mt-2 text-xs font-semibold text-red-600">
                      COD not available for orders above ₹{COD_LIMIT}. Please choose online payment.
                    </p>
                  ) : null}
                </div>
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <label className="flex items-start gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="RAZORPAY"
                  checked={selected === 'RAZORPAY'}
                  onChange={() => setSelected('RAZORPAY')}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-semibold text-ink">Online Payment</p>
                  <p className="text-xs text-muted">UPI / Card / Netbanking (Razorpay)</p>
                  <p className="mt-2 text-[11px] text-muted">
                    You will be redirected to Razorpay secure checkout.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200/80 bg-clay/50 px-5 py-4 text-sm">
            <span className="text-muted">Cart total</span>
            <span className="font-semibold text-ink">₹{itemsPrice}</span>
          </div>
          {rewardActive ? (
            <div className="mt-4 rounded-2xl border border-gold/25 bg-[rgba(201,162,74,0.08)] px-5 py-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-ink">Coupon applied: {WELCOME_COUPON_CODE}</span>
                <span className="font-semibold text-[#1F7A45]">-₹{discountAmount}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted">Payable total</span>
                <span className="font-semibold text-ink">₹{totalPrice}</span>
              </div>
            </div>
          ) : null}

          <button
            onClick={onContinue}
            className="mt-6 rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white transition hover:bg-emberDark"
          >
            Continue
          </button>
        </div>
      </section>
    </div>
  )
}

export default Payment
