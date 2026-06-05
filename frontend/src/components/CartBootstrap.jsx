import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { addToCart, hydrateCart, DEFAULT_CART_STATE } from '../features/cartSlice'
import { loadCartForUser } from '../utils/cartStorage'
import { auth } from '../services/api'
import { notifyCartItemAdded } from '../utils/cartLeadPrompt'

const PENDING_KEY = 'pendingAddToCart'

const readPending = () => {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const clearPending = () => {
  try {
    sessionStorage.removeItem(PENDING_KEY)
  } catch {
    // ignore
  }
}

function CartBootstrap() {
  const dispatch = useDispatch()

  useEffect(() => {
    const sync = () => {
      const user = auth.getUser()
      const ownerId = user?.id || user?._id || 'guest'

      const snapshot = loadCartForUser(ownerId, DEFAULT_CART_STATE)
      dispatch(
        hydrateCart({
          ownerId,
          items: snapshot.items || [],
          shippingAddress: snapshot.shippingAddress || {},
          paymentMethod: snapshot.paymentMethod || 'COD',
          coupon: snapshot.coupon || {},
        })
      )

      // If user just logged in after an "add to cart" attempt, apply it now.
      const pending = readPending()
      if (pending) {
        dispatch(addToCart(pending))
        notifyCartItemAdded({ productId: pending.product, productName: pending.name })
        clearPending()
      }
    }

    sync()
    window.addEventListener('authchange', sync)
    return () => window.removeEventListener('authchange', sync)
  }, [dispatch])

  return null
}

export default CartBootstrap
