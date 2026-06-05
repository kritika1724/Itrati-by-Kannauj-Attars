import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { removeFromCart, updateQty } from '../features/cartSlice'
import { getCartTotals, isWelcomeCouponActive, WELCOME_COUPON_CODE } from '../utils/cartOffers'

function Cart() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { items, coupon } = useSelector((state) => state.cart)

  const itemsPrice = items.reduce((sum, item) => sum + item.qty * item.price, 0)
  const { discountAmount, totalPrice } = getCartTotals({ itemsPrice, coupon })
  const rewardActive = isWelcomeCouponActive(coupon)

  return (
    <div className="bg-sand min-h-screen">
      <header className="px-6 pb-10 pt-12">
        <div className="mx-auto w-full max-w-6xl">
          <p className="ka-kicker">Cart</p>
          <h1 className="mt-4 ka-h1">Your cart</h1>
          <p className="mt-3 text-sm text-muted">Review items before checkout.</p>
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
            {items.length === 0 ? (
              <div>
                <p className="text-sm text-muted">Your cart is empty.</p>
                <Link
                  to="/products"
                  className="mt-5 ka-btn-primary px-5 py-2"
                >
                  Browse products
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {items.map((item) => (
                  <div
                    key={`${item.product}-${item.packLabel || 'default'}-${item.isSample ? 'sample' : 'regular'}`}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-clay/70 p-4"
                  >
                    <div className="min-w-[220px]">
                      <p className="text-sm font-semibold text-ink">{item.name}</p>
                      {item.packLabel && (
                        <p className="mt-1 text-xs font-semibold text-emberDark">
                          {item.isSample ? 'Sample' : 'Pack'}: {item.packLabel}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-muted">₹{item.price}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-muted">Qty</label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={item.qty}
                        onChange={(e) =>
                          dispatch(
                            updateQty({
                              product: item.product,
                              packLabel: item.packLabel || '',
                              isSample: item.isSample === true,
                              qty: e.target.value,
                            })
                          )
                        }
                        className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink"
                      />
                      <button
                        onClick={() =>
                          dispatch(
                            removeFromCart({
                              product: item.product,
                              packLabel: item.packLabel || '',
                              isSample: item.isSample === true,
                            })
                          )
                        }
                        className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
            <h2 className="text-lg font-semibold text-ink">Summary</h2>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted">Items total</span>
              <span className="font-semibold text-ink">₹{itemsPrice}</span>
            </div>
            {rewardActive ? (
              <>
                <div className="mt-3 rounded-2xl border border-gold/25 bg-[rgba(201,162,74,0.08)] px-4 py-3 text-sm">
                  <p className="font-semibold text-ink">Coupon applied: {WELCOME_COUPON_CODE}</p>
                  <p className="mt-1 text-xs text-muted">Your 5% welcome discount is active on this cart.</p>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted">Discount</span>
                  <span className="font-semibold text-[#1F7A45]">-₹{discountAmount}</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 pt-3 text-sm">
                  <span className="text-muted">Payable total</span>
                  <span className="text-lg font-semibold text-ink">₹{totalPrice}</span>
                </div>
              </>
            ) : null}
            <button
              disabled={items.length === 0}
              onClick={() => navigate('/checkout/shipping')}
              className="mt-6 w-full rounded-full bg-ember px-5 py-3 text-sm font-semibold text-white transition hover:bg-emberDark disabled:cursor-not-allowed disabled:opacity-60"
            >
              Proceed to checkout
            </button>
            <p className="mt-3 text-xs font-semibold text-muted">
              You can continue checkout without logging in.
            </p>
            <Link
              to="/products"
              className="mt-3 ka-btn-ghost w-full px-5 py-3"
            >
              Continue shopping
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Cart
