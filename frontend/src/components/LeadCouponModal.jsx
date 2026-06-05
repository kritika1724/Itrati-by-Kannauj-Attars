import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { FiBell, FiGift, FiStar, FiTruck, FiUserPlus, FiX } from 'react-icons/fi'
import { api } from '../services/api'
import { unlockLeadCoupon } from '../features/cartSlice'
import { CART_ITEM_ADDED_EVENT } from '../utils/cartLeadPrompt'
import { isWelcomeCouponActive, WELCOME_COUPON_CODE, WELCOME_COUPON_PERCENT } from '../utils/cartOffers'

const benefits = [
  { icon: FiGift, title: `Instant ${WELCOME_COUPON_PERCENT}% off`, copy: 'Coupon unlocks after details submit.' },
  { icon: FiTruck, title: 'Order updates first', copy: 'Priority notifications.' },
  { icon: FiStar, title: 'Early access drops', copy: 'New attars before everyone else.' },
  { icon: FiBell, title: 'Members-only offers', copy: 'Private seasonal deals.' },
]

const initialErrors = {
  fullName: '',
  mobileNumber: '',
  email: '',
  addressLine1: '',
  city: '',
  state: '',
}

const initialForm = {
  fullName: '',
  mobileNumber: '',
  email: '',
  addressLine1: '',
  city: '',
  state: '',
}

const DEVICE_MEMBER_KEY = 'ka:fragrance-club:joined-device:v1'

const hasDeviceFragranceClubJoin = () => {
  if (typeof window === 'undefined') return false
  try {
    return Boolean(window.localStorage.getItem(DEVICE_MEMBER_KEY))
  } catch {
    return false
  }
}

const markDeviceFragranceClubJoin = (member = {}) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      DEVICE_MEMBER_KEY,
      JSON.stringify({
        memberId: String(member?.id || '').trim(),
        email: String(member?.email || '').trim().toLowerCase(),
        mobileNumber: String(member?.mobileNumber || '').trim(),
        joinedAt: new Date().toISOString(),
      })
    )
  } catch {
    // ignore storage errors
  }
}

function LeadCouponModal() {
  const dispatch = useDispatch()
  const { shippingAddress, coupon, items } = useSelector((state) => state.cart)
  const rewardUnlocked = isWelcomeCouponActive(coupon)
  const [deviceJoined, setDeviceJoined] = useState(() => hasDeviceFragranceClubJoin())
  const [open, setOpen] = useState(false)
  const [rewardOpen, setRewardOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState(initialErrors)
  const [form, setForm] = useState(initialForm)

  const cartValue = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0),
    [items]
  )

  const prefilledForm = useMemo(
    () => ({
      fullName: shippingAddress?.fullName || '',
      mobileNumber: shippingAddress?.phone || shippingAddress?.whatsapp || '',
      email: shippingAddress?.email || '',
      addressLine1: shippingAddress?.addressLine1 || '',
      city: shippingAddress?.city || '',
      state: shippingAddress?.state || '',
    }),
    [shippingAddress]
  )

  useEffect(() => {
    if (!open || rewardOpen) return
    setForm(prefilledForm)
    setErrors(initialErrors)
    setError('')
  }, [open, prefilledForm, rewardOpen])

  useEffect(() => {
    const onCartItemAdded = () => {
      if (rewardUnlocked || deviceJoined) return
      setRewardOpen(false)
      setOpen(true)
    }
    window.addEventListener(CART_ITEM_ADDED_EVENT, onCartItemAdded)
    return () => window.removeEventListener(CART_ITEM_ADDED_EVENT, onCartItemAdded)
  }, [rewardUnlocked, deviceJoined])

  useEffect(() => {
    if (!deviceJoined) return
    setOpen(false)
  }, [deviceJoined])

  if (typeof document === 'undefined') return null

  const close = () => {
    setOpen(false)
    setRewardOpen(false)
    setSubmitting(false)
    setError('')
    setErrors(initialErrors)
  }

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (key in errors) {
      setErrors((prev) => ({ ...prev, [key]: '' }))
    }
    setError('')
  }

  const validate = () => {
    const nextErrors = { ...initialErrors }
    if (!String(form.fullName || '').trim()) nextErrors.fullName = 'Please enter your full name.'
    if (!String(form.mobileNumber || '').trim()) nextErrors.mobileNumber = 'Mobile number is required.'
    if (!String(form.addressLine1 || '').trim()) nextErrors.addressLine1 = 'Address is required.'
    if (!String(form.city || '').trim()) nextErrors.city = 'City is required.'
    if (!String(form.state || '').trim()) nextErrors.state = 'State is required.'
    const email = String(form.email || '').trim()
    if (!email) nextErrors.email = 'Email address is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'Enter a valid email address.'
    setErrors(nextErrors)
    return !Object.values(nextErrors).some(Boolean)
  }

  const submit = async () => {
    if (!validate()) return
    setSubmitting(true)
    setError('')
    try {
      const response = await api.joinFragranceClub({
        fullName: form.fullName,
        mobileNumber: form.mobileNumber,
        email: form.email,
        addressLine1: form.addressLine1,
        city: form.city,
        state: form.state,
        cartItems: items.map((item) => item.name).filter(Boolean),
        cartValue,
      })

      dispatch(
        unlockLeadCoupon({
          fullName: response?.member?.fullName || form.fullName,
          phone: response?.member?.mobileNumber || form.mobileNumber,
          email: response?.member?.email || form.email,
          addressLine1: response?.member?.addressLine1 || form.addressLine1,
          city: response?.member?.city || form.city,
          state: response?.member?.state || form.state,
        })
      )
      markDeviceFragranceClubJoin(response?.member)
      setDeviceJoined(true)
      setOpen(false)
      setRewardOpen(true)
    } catch (err) {
      const duplicateFields = Array.isArray(err?.duplicateFields) ? err.duplicateFields : []
      if (duplicateFields.length) {
        setErrors((prev) => ({
          ...prev,
          mobileNumber: duplicateFields.includes('mobileNumber')
            ? 'This mobile number is already saved. Please enter a new number.'
            : prev.mobileNumber,
          email: duplicateFields.includes('email')
            ? 'This email is already saved. Please enter a new email.'
            : prev.email,
        }))
      }
      setError(err.message || 'Unable to unlock reward right now.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open && !rewardOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[95]">
      <button
        type="button"
        onClick={close}
        className="absolute inset-0 bg-[rgba(9,14,28,0.52)] backdrop-blur-[4px]"
        aria-label="Close fragrance club popup"
      />

      {rewardOpen ? (
        <div className="absolute left-1/2 top-1/2 w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[1.8rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,248,242,0.97))] shadow-[0_44px_120px_rgba(12,18,36,0.28)]">
          <div className="pointer-events-none absolute -left-12 top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(201,162,74,0.16),transparent_70%)] blur-2xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 bg-[radial-gradient(circle_at_center,rgba(255,214,221,0.16),transparent_68%)]" />
          <div className="pointer-events-none absolute bottom-0 right-20 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(255,237,210,0.22),transparent_68%)] blur-xl" />

          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 z-20 rounded-full border border-[rgba(25,33,60,0.08)] bg-white/90 p-2 text-[#19213C] transition hover:border-gold/30"
            aria-label="Close"
          >
            <FiX size={16} />
          </button>

          <div className="relative px-5 py-7 text-center sm:px-7 sm:py-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top,rgba(201,162,74,0.26),transparent_62%)]" />
            {Array.from({ length: 14 }).map((_, index) => (
              <motion.span
                key={index}
                className="pointer-events-none absolute left-1/2 top-10 h-3 w-2 rounded-full"
                style={{
                  background: index % 2 === 0 ? '#C9A24A' : '#F5D899',
                }}
                initial={{
                  x: (index - 7) * 12,
                  y: -10,
                  rotate: 0,
                  opacity: 0,
                }}
                animate={{
                  x: (index - 7) * 24,
                  y: 70 + (index % 3) * 14,
                  rotate: 160 + index * 12,
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  repeatDelay: 0.4,
                  delay: index * 0.04,
                }}
              />
            ))}

            <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(201,162,74,0.16)] text-[#C9A24A] shadow-[0_16px_36px_rgba(201,162,74,0.18)]">
              <FiGift size={28} />
            </div>
            <p className="mt-5 font-display text-2xl leading-tight text-[#19213C] sm:text-3xl">
              ✨ Congratulations! Your Welcome Gift Has Been Unlocked
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#5F6475] sm:text-base">
              Your details have been saved successfully. Your welcome reward is now ready to use at checkout.
            </p>
            <div className="mx-auto mt-5 w-full max-w-xs rounded-[1.4rem] border border-gold/22 bg-[linear-gradient(135deg,rgba(201,162,74,0.14),rgba(255,255,255,0.95))] px-5 py-4 shadow-[0_18px_40px_rgba(201,162,74,0.12)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8D7667]">Coupon code</p>
              <p className="mt-3 font-display text-4xl tracking-[0.18em] text-[#19213C]">{WELCOME_COUPON_CODE}</p>
            </div>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-[#5F6475] sm:text-base">
              Apply this code during checkout and enjoy {WELCOME_COUPON_PERCENT}% OFF on your entire order.
            </p>
            <div className="mx-auto mt-6 w-full max-w-sm rounded-[1.3rem] border border-[rgba(25,33,60,0.08)] bg-white/90 px-4 py-4 text-left shadow-sm">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-[#19213C]">You're now an ITRATI Member</span>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8D7667]">100%</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[rgba(25,33,60,0.08)]">
                <motion.div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#E9D28A_0%,#C9A24A_100%)]"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              </div>
            </div>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={close}
                className="rounded-full border border-[rgba(25,33,60,0.1)] bg-white px-5 py-3 text-sm font-semibold text-[#19213C] transition hover:border-gold/30"
              >
                Continue shopping
              </button>
              <Link
                to="/cart"
                onClick={close}
                className="rounded-full bg-[linear-gradient(135deg,#E9D28A_0%,#C9A24A_100%)] px-5 py-3 text-sm font-semibold text-[#1B233F] shadow-[0_18px_40px_rgba(196,139,106,0.20)]"
              >
                Review my cart
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {open ? (
      <div className="absolute left-1/2 top-1/2 max-h-[86vh] w-[min(760px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1.8rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(252,248,242,0.97))] shadow-[0_44px_120px_rgba(12,18,36,0.28)]">
        <div className="pointer-events-none absolute -left-12 top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(201,162,74,0.16),transparent_70%)] blur-2xl" />
        <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 bg-[radial-gradient(circle_at_center,rgba(255,214,221,0.16),transparent_68%)]" />
        <div className="pointer-events-none absolute bottom-0 right-20 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(255,237,210,0.22),transparent_68%)] blur-xl" />

        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 z-20 rounded-full border border-[rgba(25,33,60,0.08)] bg-white/90 p-2 text-[#19213C] transition hover:border-gold/30"
          aria-label="Close"
        >
          <FiX size={16} />
        </button>

          <div className="grid md:grid-cols-[0.88fr_1.12fr]">
            <div className="relative overflow-hidden border-b border-[rgba(25,33,60,0.08)] bg-[linear-gradient(180deg,rgba(252,246,239,0.96),rgba(255,255,255,0.92))] px-5 py-6 md:border-b-0 md:border-r md:px-6 md:py-6">
              <div className="pointer-events-none absolute inset-0 opacity-60">
                <div className="absolute left-6 top-6 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(201,162,74,0.18),transparent_70%)] blur-xl" />
                <div className="absolute bottom-4 right-6 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,219,226,0.22),transparent_72%)] blur-xl" />
              </div>
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-white/90 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8D7667] shadow-sm">
                  <FiUserPlus className="text-[#C9A24A]" size={14} />
                  Fragrance Club
                </div>
                <h3 className="mt-4 font-display text-[clamp(1.75rem,3vw,2.55rem)] leading-[1.04] text-[#19213C]">
                  Welcome to the ITRATI Fragrance Club
                </h3>
                <p className="mt-3 text-sm leading-6 text-[#5F6475]">
                  Let's connect and unlock your welcome reward.
                </p>

                <div className="mt-5 grid gap-2 sm:grid-cols-2 md:grid-cols-1">
                  {benefits.map((benefit) => {
                    const Icon = benefit.icon
                    return (
                      <div
                        key={benefit.title}
                        className="rounded-[1.2rem] border border-[rgba(25,33,60,0.08)] bg-white/84 px-3.5 py-3.5 shadow-[0_12px_30px_rgba(25,33,60,0.06)]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[radial-gradient(circle,rgba(201,162,74,0.18),rgba(255,255,255,0.94))] text-[#C9A24A]">
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#19213C]">{benefit.title}</p>
                            <p className="mt-1 text-xs leading-5 text-[#5F6475]">{benefit.copy}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

              </div>
            </div>

            <div className="px-5 py-6 sm:px-6 sm:py-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8D7667]">Let's connect</p>
                  <p className="mt-2 text-sm leading-6 text-[#5F6475]">
                    Share your details below. Once they are submitted successfully, your coupon code will be unlocked.
                  </p>
                </div>
                <div className="hidden rounded-full border border-gold/18 bg-[rgba(201,162,74,0.10)] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[#8D7667] sm:inline-flex">
                  {WELCOME_COUPON_PERCENT}% off
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8D7667]">
                    Full Name
                  </label>
                  <input
                    value={form.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    type="text"
                    autoComplete="name"
                    className="mt-2 w-full rounded-[1.1rem] border border-[rgba(25,33,60,0.12)] bg-white px-4 py-2.5 text-sm text-[#19213C] shadow-sm outline-none transition focus:border-gold/40"
                    placeholder="Your full name"
                  />
                  {errors.fullName ? <p className="mt-2 text-xs font-semibold text-red-600">{errors.fullName}</p> : null}
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8D7667]">
                    Email Address
                  </label>
                  <input
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    type="email"
                    autoComplete="email"
                    className="mt-2 w-full rounded-[1.1rem] border border-[rgba(25,33,60,0.12)] bg-white px-4 py-2.5 text-sm text-[#19213C] shadow-sm outline-none transition focus:border-gold/40"
                    placeholder="you@email.com"
                  />
                  {errors.email ? <p className="mt-2 text-xs font-semibold text-red-600">{errors.email}</p> : null}
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8D7667]">
                    Mobile Number
                  </label>
                  <input
                    value={form.mobileNumber}
                    onChange={(e) => updateField('mobileNumber', e.target.value)}
                    type="tel"
                    autoComplete="tel"
                    className="mt-2 w-full rounded-[1.1rem] border border-[rgba(25,33,60,0.12)] bg-white px-4 py-2.5 text-sm text-[#19213C] shadow-sm outline-none transition focus:border-gold/40"
                    placeholder="+91XXXXXXXXXX"
                  />
                  {errors.mobileNumber ? <p className="mt-2 text-xs font-semibold text-red-600">{errors.mobileNumber}</p> : null}
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8D7667]">
                    Address
                  </label>
                  <input
                    value={form.addressLine1}
                    onChange={(e) => updateField('addressLine1', e.target.value)}
                    type="text"
                    autoComplete="street-address"
                    className="mt-2 w-full rounded-[1.1rem] border border-[rgba(25,33,60,0.12)] bg-white px-4 py-2.5 text-sm text-[#19213C] shadow-sm outline-none transition focus:border-gold/40"
                    placeholder="House / street / locality"
                  />
                  {errors.addressLine1 ? (
                    <p className="mt-2 text-xs font-semibold text-red-600">{errors.addressLine1}</p>
                  ) : null}
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8D7667]">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    type="text"
                    autoComplete="address-level2"
                    className="mt-2 w-full rounded-[1.1rem] border border-[rgba(25,33,60,0.12)] bg-white px-4 py-2.5 text-sm text-[#19213C] shadow-sm outline-none transition focus:border-gold/40"
                    placeholder="Kannauj"
                  />
                  {errors.city ? <p className="mt-2 text-xs font-semibold text-red-600">{errors.city}</p> : null}
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8D7667]">State</label>
                  <input
                    value={form.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    type="text"
                    autoComplete="address-level1"
                    className="mt-2 w-full rounded-[1.1rem] border border-[rgba(25,33,60,0.12)] bg-white px-4 py-2.5 text-sm text-[#19213C] shadow-sm outline-none transition focus:border-gold/40"
                    placeholder="Uttar Pradesh"
                  />
                  {errors.state ? <p className="mt-2 text-xs font-semibold text-red-600">{errors.state}</p> : null}
                </div>
              </div>

              {error ? (
                <div className="mt-4 rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="flex-1 rounded-full bg-[linear-gradient(135deg,#E9D28A_0%,#C9A24A_100%)] px-5 py-3 text-sm font-semibold text-[#1B233F] shadow-[0_18px_40px_rgba(196,139,106,0.20)] transition hover:brightness-[1.02] disabled:opacity-60"
                >
                  {submitting ? 'Connecting & unlocking…' : "Let's Connect"}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full border border-[rgba(25,33,60,0.1)] bg-white px-6 py-3 text-sm font-semibold text-[#19213C] transition hover:border-gold/30"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        
      </div>
      ) : null}
    </div>,
    document.body
  )
}

export default LeadCouponModal
