let razorpayPromise = null

export const loadRazorpay = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Not in browser'))
  if (window.Razorpay) return Promise.resolve(true)
  if (razorpayPromise) return razorpayPromise

  razorpayPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'))
    document.body.appendChild(script)
  })

  return razorpayPromise
}

export const openRazorpayCheckout = async ({
  key,
  razorpayOrderId,
  amount,
  currency,
  name,
  description,
  prefill,
  themeColor,
  onSuccess,
  onDismiss,
  onFailure,
}) => {
  await loadRazorpay()

  if (!window.Razorpay) throw new Error('Razorpay SDK not available')

  const rzp = new window.Razorpay({
    key,
    amount,
    currency,
    name,
    description,
    order_id: razorpayOrderId,
    prefill,
    theme: { color: themeColor || '#111B3A' },
    handler: onSuccess,
    modal: {
      ondismiss: onDismiss,
    },
  })

  if (typeof onFailure === 'function') {
    rzp.on('payment.failed', (response) => {
      onFailure(response?.error || {}, response)
    })
  }

  rzp.open()
  return rzp
}
