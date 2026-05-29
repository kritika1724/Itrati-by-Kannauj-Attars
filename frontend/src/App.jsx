import { BrowserRouter, Routes, Route, NavLink, Navigate, Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { auth } from './services/api'
import { FiMenu, FiX } from 'react-icons/fi'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'

import ProtectedRoute from './components/ProtectedRoute'
import LogoMark from './components/LogoMark'
import BrandWordmark from './components/BrandWordmark'
import CursorGlow from './components/CursorGlow'
import SiteFooter from './components/SiteFooter'
import { BUSINESS } from './config/business'
import { pageShell } from './lib/motion'
import { wishlistStorage } from './components/product/wishlist'

const Home = lazy(() => import('./pages/Home'))
const Collections = lazy(() => import('./pages/Collections'))
const Contact = lazy(() => import('./pages/Contact'))
const Products = lazy(() => import('./pages/Products'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const TrackOrder = lazy(() => import('./pages/TrackOrder'))
const Account = lazy(() => import('./pages/Account'))
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'))
const NotFound = lazy(() => import('./pages/NotFound'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const Signature = lazy(() => import('./pages/collections/Signature'))
const Heritage = lazy(() => import('./pages/collections/Heritage'))
const PurposeCollection = lazy(() => import('./pages/collections/PurposeCollection'))
const FeaturedCollection = lazy(() => import('./pages/collections/FeaturedCollection'))
const Gallery = lazy(() => import('./pages/Gallery'))
const Ceo = lazy(() => import('./pages/Ceo'))
const Cart = lazy(() => import('./pages/Cart'))
const Shipping = lazy(() => import('./pages/checkout/Shipping'))
const Payment = lazy(() => import('./pages/checkout/Payment'))
const PlaceOrder = lazy(() => import('./pages/checkout/PlaceOrder'))
const PaymentSuccess = lazy(() => import('./pages/checkout/PaymentSuccess'))
const PaymentFailure = lazy(() => import('./pages/checkout/PaymentFailure'))
const OrderDetail = lazy(() => import('./pages/OrderDetail'))
const MyOrders = lazy(() => import('./pages/MyOrders'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminOrders = lazy(() => import('./pages/AdminOrders'))
const AdminProducts = lazy(() => import('./pages/AdminProducts'))
const AdminProductForm = lazy(() => import('./pages/AdminProductForm'))
const AdminMedia = lazy(() => import('./pages/AdminMedia'))
const AdminSiteContent = lazy(() => import('./pages/AdminSiteContent'))
const AdminContacts = lazy(() => import('./pages/AdminContacts'))
const AdminFilters = lazy(() => import('./pages/AdminFilters'))

const navLinkClass = ({ isActive }) =>
  `relative text-sm font-semibold tracking-wide transition ${
    isActive
      ? 'text-ink after:absolute after:-bottom-2 after:left-0 after:h-px after:w-full after:bg-[linear-gradient(90deg,rgba(200,163,104,1),rgba(200,163,104,0.12))] after:content-[""]'
      : 'text-emberDark/80 hover:text-ink hover:-translate-y-0.5'
  }`

const mobileNavLinkClass = ({ isActive }) =>
  `flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
    isActive
      ? 'border-gold/35 bg-clay/70 text-ink'
      : 'border-slate-200 bg-white text-emberDark hover:border-gold/35 hover:bg-clay/60'
  }`

const adminNavLinkClass = ({ isActive }) =>
  `rounded-full border px-4 py-2 text-sm font-semibold transition ${
    isActive
      ? 'border-gold/40 bg-gold text-midnight'
      : 'border-white/10 bg-white/5 text-white hover:border-gold/35 hover:bg-white/10'
  }`

const mobileQuickActions = [
  {
    key: 'home',
    label: 'Home',
    to: '/',
    symbol: '⌂',
    isActive: (pathname) => pathname === '/',
  },
  {
    key: 'products',
    label: 'Products',
    to: '/products',
    symbol: '❖',
    isActive: (pathname) => pathname.startsWith('/products'),
  },
  {
    key: 'wishlist',
    label: 'Wishlist',
    to: '/wishlist',
    symbol: '♡',
    isActive: (pathname) => pathname === '/wishlist',
  },
  {
    key: 'cart',
    label: 'Cart',
    to: '/cart',
    symbol: '◌',
    isActive: (pathname) => pathname === '/cart' || pathname.startsWith('/checkout'),
  },
  {
    key: 'track',
    label: 'Track',
    to: '/track-order',
    symbol: '➜',
    isActive: (pathname) => pathname === '/track-order',
  },
  {
    key: 'contact',
    label: 'Contact',
    to: '/contact',
    symbol: '✆',
    isActive: (pathname) => pathname === '/contact',
  },
]

function RouteLoader() {
  return (
    <div className="ka-page-aura min-h-[50vh] bg-sand px-4 py-14 sm:px-6">
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div className="h-8 w-48 animate-pulse rounded-full bg-clay/80" />
        <div className="h-20 w-full animate-pulse rounded-[2rem] bg-white/80 shadow-sm" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-52 animate-pulse rounded-[2rem] bg-white/80 shadow-sm" />
          ))}
        </div>
      </div>
    </div>
  )
}

function AppShell() {
  const location = useLocation()
  const cartCount = useSelector((state) => state.cart.items.reduce((sum, i) => sum + i.qty, 0))
  const [wishlistCount, setWishlistCount] = useState(() => wishlistStorage.read().length)
  const [user, setUser] = useState(auth.getUser())
  const headerRef = useRef(null)
  const isAdmin = user?.isAdmin === true
  const isLoggedIn = !!user
  const [mobileOpen, setMobileOpen] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(88)
  const inAdminArea = isAdmin && location.pathname.startsWith('/admin')
  const { scrollYProgress } = useScroll()
  const routeKey = `${location.pathname}${location.search}`
  const progressScaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.55,
  })

  useEffect(() => {
    const onAuth = () => setUser(auth.getUser())
    window.addEventListener('authchange', onAuth)
    return () => window.removeEventListener('authchange', onAuth)
  }, [])

  useEffect(() => {
    const syncWishlist = (event) => {
      const next = Array.isArray(event?.detail) ? event.detail.length : wishlistStorage.read().length
      setWishlistCount(next)
    }

    window.addEventListener('wishlistchange', syncWishlist)
    return () => window.removeEventListener('wishlistchange', syncWishlist)
  }, [])

  useEffect(() => {
    if (inAdminArea) return undefined
    const node = headerRef.current
    if (!node || typeof window === 'undefined') return undefined

    const updateHeight = () => {
      const next = Math.round(node.getBoundingClientRect().height)
      if (next > 0) setHeaderHeight(next)
    }

    updateHeight()

    let resizeObserver
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(updateHeight)
      resizeObserver.observe(node)
    }

    window.addEventListener('resize', updateHeight)
    window.addEventListener('orientationchange', updateHeight)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateHeight)
      window.removeEventListener('orientationchange', updateHeight)
    }
  }, [inAdminArea])

  useEffect(() => {
    // Close mobile menu on md+ screens.
    try {
      const mq = window.matchMedia('(min-width: 768px)')
      const onChange = () => {
        if (mq.matches) setMobileOpen(false)
      }
      onChange()
      if (mq.addEventListener) mq.addEventListener('change', onChange)
      else mq.addListener(onChange)
      return () => {
        if (mq.removeEventListener) mq.removeEventListener('change', onChange)
        else mq.removeListener(onChange)
      }
    } catch {
      return undefined
    }
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const previousOverflow = document.body.style.overflow
    const previousOverscroll = document.body.style.overscrollBehavior

    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.overscrollBehavior = 'contain'
    }

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.overscrollBehavior = previousOverscroll
    }
  }, [mobileOpen])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.style.setProperty('--ka-nav-height', `${headerHeight}px`)
  }, [headerHeight])

  useEffect(() => {
    if (inAdminArea) {
      setMobileOpen(false)
    }
  }, [inAdminArea])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (location.hash) {
        const target = document.getElementById(decodeURIComponent(location.hash.slice(1)))
        if (target) {
          target.scrollIntoView({ block: 'start' })
          return
        }
      }

      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [location.pathname, location.search, location.hash])

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-[linear-gradient(90deg,#c9a24a_0%,#fff3cf_45%,#111b3a_100%)] shadow-[0_0_16px_rgba(201,162,74,0.45)]"
        style={{ scaleX: progressScaleX }}
      />
      <CursorGlow />
      {inAdminArea ? (
        <header className="sticky top-0 z-20 border-b border-gold/20 bg-[linear-gradient(135deg,#070B18,#111B3A)] shadow-[0_18px_40px_rgba(7,11,24,0.35)]">
          <div className="ka-container flex flex-wrap items-center justify-between gap-4 py-4">
            <Link to="/admin" className="flex min-w-0 items-center gap-3" aria-label="Go to admin dashboard">
              <LogoMark />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-display text-xl tracking-wide text-white sm:text-2xl">
                  {BUSINESS.displayName} <span className="text-gold">Admin</span>
                </span>
                <span className="truncate text-xs uppercase tracking-[0.3em] text-white/65">
                  {BUSINESS.endorsement} • Dashboard access
                </span>
              </div>
            </Link>

            <nav className="flex flex-wrap items-center gap-2">
              <NavLink to="/admin" end className={adminNavLinkClass}>
                Dashboard
              </NavLink>
              <NavLink to="/admin/orders" className={adminNavLinkClass}>
                Orders
              </NavLink>
              <NavLink to="/admin/products" className={adminNavLinkClass}>
                Products
              </NavLink>
              <NavLink to="/admin/media" className={adminNavLinkClass}>
                Website Images
              </NavLink>
              <NavLink to="/admin/content" className={adminNavLinkClass}>
                Website Content
              </NavLink>
              <NavLink to="/admin/filters" className={adminNavLinkClass}>
                Filters
              </NavLink>
              <NavLink to="/admin/contacts" className={adminNavLinkClass}>
                Contacts
              </NavLink>
              <Link
                to="/"
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-gold/35 hover:bg-white/10"
              >
                View site
              </Link>
            </nav>
          </div>
        </header>
      ) : (
        <header
          ref={headerRef}
          className="ka-nav-shell sticky top-0 z-40 relative border-b border-white/45 bg-[linear-gradient(180deg,rgba(255,250,244,0.76),rgba(255,250,244,0.58))] shadow-[0_18px_50px_rgba(37,25,16,0.10)] backdrop-blur-2xl"
        >
          <div className="ka-container flex items-center justify-between gap-4 py-5">
            <Link
              to="/"
              onClick={() => {
                setMobileOpen(false)
                try {
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                } catch {
                  // ignore
                }
              }}
              className="group flex flex-1 min-w-0 items-center gap-3 md:flex-none"
              aria-label="Go to home"
              title={BUSINESS.displayName}
            >
              <LogoMark className="h-14 w-14 sm:h-[3.5rem] sm:w-[3.5rem]" />
              <div className="flex min-w-0 flex-col items-start justify-center leading-none">
                <BrandWordmark className="ml-1 sm:ml-1.5 max-w-[11.25rem] sm:max-w-[15.5rem]" />
                <span className="truncate pl-1.5 pt-0.5 text-[10px] uppercase tracking-[0.22em] text-muted sm:pl-2.5 sm:text-xs sm:tracking-[0.3em]">
                  {BUSINESS.endorsement} • Since {BUSINESS.since}
                </span>
              </div>
            </Link>

            <nav className="hidden items-center gap-5 md:flex">
              <NavLink to="/" end className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/products" className={navLinkClass}>
                Products
              </NavLink>
              {!isAdmin ? (
                <NavLink to="/wishlist" className={navLinkClass}>
                  <span className="inline-flex items-center gap-2">
                    Wishlist
                    {wishlistCount > 0 && (
                      <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[#C9A24A] px-2 py-0.5 text-[10px] font-semibold text-[#19213C]">
                        {wishlistCount}
                      </span>
                    )}
                  </span>
                </NavLink>
              ) : null}
              {!isAdmin ? (
                <NavLink to="/cart" className={navLinkClass}>
                  <span className="inline-flex items-center gap-2">
                    Cart
                    {cartCount > 0 && (
                      <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-ember px-2 py-0.5 text-[10px] font-semibold text-white">
                        {cartCount}
                      </span>
                    )}
                  </span>
                </NavLink>
              ) : (
                isAdmin ? (
                  <NavLink to="/admin" className={navLinkClass}>
                    Admin
                  </NavLink>
                ) : null
              )}
              {!isAdmin ? (
                <NavLink to="/track-order" className={navLinkClass}>
                  Track Order
                </NavLink>
              ) : null}
              {!isAdmin ? (
                <NavLink to="/contact" className={navLinkClass}>
                  Contact
                </NavLink>
              ) : null}
              <NavLink to="/account" className={navLinkClass}>
                {user ? 'Account' : 'Login'}
              </NavLink>
            </nav>

            <button
              type="button"
              className="relative z-50 inline-flex items-center justify-center rounded-2xl border border-gold/35 bg-[rgba(255,250,244,0.56)] px-3 py-3 text-emberDark shadow-sm transition hover:border-gold/60 hover:bg-[rgba(200,169,106,0.20)] md:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>
          </div>

          {!isAdmin ? (
            <div className="border-t border-white/45 px-3 pb-3 pt-2 md:hidden">
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {mobileQuickActions.map((action) => {
                  const active = action.isActive(location.pathname)
                  const badgeCount =
                    action.key === 'wishlist' ? wishlistCount : action.key === 'cart' ? cartCount : 0

                  return (
                    <Link
                      key={action.key}
                      to={action.to}
                      className={`group flex min-w-[4.4rem] flex-1 flex-col items-center justify-center gap-1 rounded-[1.2rem] border px-2 py-2 text-center transition ${
                        active
                          ? 'border-gold/40 bg-[rgba(200,169,106,0.14)] text-ink shadow-[0_14px_32px_rgba(200,169,106,0.16)]'
                          : 'border-white/70 bg-white/82 text-emberDark hover:border-gold/35 hover:bg-white'
                      }`}
                    >
                      <span
                        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
                          active
                            ? 'bg-[linear-gradient(135deg,#E9D28A_0%,#C9A24A_100%)] shadow-[0_10px_24px_rgba(201,162,74,0.24)]'
                            : 'bg-[rgba(25,33,60,0.06)] group-hover:bg-[rgba(200,169,106,0.16)]'
                        }`}
                        aria-hidden="true"
                      >
                        <span className="text-base leading-none">{action.symbol}</span>
                        {badgeCount > 0 ? (
                          <span className="absolute -right-1.5 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[#19213C] px-1.5 py-0.5 text-[9px] font-semibold text-white">
                            {badgeCount}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-[10px] font-semibold tracking-[0.06em]">{action.label}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          ) : null}

          <AnimatePresence>
            {mobileOpen ? (
              <>
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-30 bg-black/42 backdrop-blur-[2px]"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                />
                <motion.div
                  id="mobile-nav"
                  initial={{ opacity: 0, y: -18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  style={{ top: `${Math.max(headerHeight + 8, 80)}px` }}
                  className="fixed inset-x-3 z-40 max-h-[calc(100svh-6.5rem)] overflow-y-auto rounded-[1.75rem] border border-gold/24 bg-[linear-gradient(180deg,rgba(255,250,244,0.98),rgba(247,250,255,0.96))] shadow-[0_30px_80px_rgba(11,20,48,0.18)] backdrop-blur-2xl md:hidden"
                >
                  <div className="p-3">
                    <div className="grid gap-2">
                      <NavLink to="/" end className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                        Home
                      </NavLink>
                      <NavLink to="/products" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                        Products
                      </NavLink>

                      {!isAdmin ? (
                        <NavLink to="/wishlist" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                          <span className="inline-flex items-center gap-2">
                            Wishlist
                            {wishlistCount > 0 ? (
                              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[#C9A24A] px-2 py-0.5 text-[10px] font-semibold text-[#19213C]">
                                {wishlistCount}
                              </span>
                            ) : null}
                          </span>
                        </NavLink>
                      ) : null}

                      {!isAdmin ? (
                        <NavLink to="/cart" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                          <span className="inline-flex items-center gap-2">
                            Cart
                            {cartCount > 0 ? (
                              <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-ember px-2 py-0.5 text-[10px] font-semibold text-white">
                                {cartCount}
                              </span>
                            ) : null}
                          </span>
                        </NavLink>
                      ) : isAdmin ? (
                        <NavLink to="/admin" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                          Admin
                        </NavLink>
                      ) : null}

                      {!isAdmin ? (
                        <NavLink to="/track-order" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                          Track Order
                        </NavLink>
                      ) : null}

                      {!isAdmin ? (
                        <NavLink to="/contact" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                          Contact
                        </NavLink>
                      ) : null}

                      <NavLink to="/account" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                        {user ? 'Account' : 'Login'}
                      </NavLink>
                    </div>
                  </div>
                </motion.div>
              </>
            ) : null}
          </AnimatePresence>
        </header>
      )}

      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={routeKey}
          variants={pageShell}
          initial="initial"
          animate="animate"
          exit="exit"
          className="relative"
        >
          <Suspense fallback={<RouteLoader />}>
            <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/collections" element={<Collections />} />
        <Route path="/about" element={<Navigate to="/" replace />} />
        <Route path="/explore" element={<Navigate to="/" replace />} />
        <Route path="/discovery-set" element={<Navigate to="/products?keyword=Discovery%20Set" replace />} />
        <Route path="/products" element={<Products />} />
        <Route
          path="/wishlist"
          element={
            isAdmin ? (
              <Navigate to="/admin" replace />
            ) : (
              <Wishlist />
            )
          }
        />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/collections/purpose/:purposeId" element={<PurposeCollection />} />
        <Route path="/collections/signature" element={<Signature />} />
        <Route path="/collections/heritage" element={<Heritage />} />
        <Route path="/collections/:collectionSlug" element={<FeaturedCollection />} />
        <Route path="/ceo" element={<Ceo />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/account" element={<Account />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/terms-of-service" element={<LegalPage />} />
        <Route path="/refund-policy" element={<LegalPage />} />
        <Route path="/privacy-policy" element={<LegalPage />} />
        <Route path="/shipping-policy" element={<LegalPage />} />

        <Route
          path="/account/orders"
          element={
            isAdmin ? (
              <Navigate to="/admin/orders" replace />
            ) : (
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            )
          }
        />
        <Route
          path="/cart"
          element={
            isAdmin ? (
              <Navigate to="/admin" replace />
            ) : (
              <Cart />
            )
          }
        />
        <Route
          path="/checkout/shipping"
          element={
            isAdmin ? (
              <Navigate to="/admin" replace />
            ) : (
              <Shipping />
            )
          }
        />
        <Route
          path="/checkout/payment"
          element={
            isAdmin ? (
              <Navigate to="/admin" replace />
            ) : (
              <Payment />
            )
          }
        />
        <Route
          path="/checkout/place-order"
          element={
            isAdmin ? (
              <Navigate to="/admin" replace />
            ) : (
              <PlaceOrder />
            )
          }
        />
        <Route
          path="/checkout/success/:id"
          element={
            isAdmin ? (
              <Navigate to="/admin/orders" replace />
            ) : (
              <PaymentSuccess />
            )
          }
        />
        <Route
          path="/checkout/failure/:id"
          element={
            isAdmin ? (
              <Navigate to="/admin/orders" replace />
            ) : (
              <PaymentFailure />
            )
          }
        />
        <Route
          path="/order/:id"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute adminOnly>
              <AdminOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute adminOnly>
              <AdminProducts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/new"
          element={
            <ProtectedRoute adminOnly>
              <AdminProductForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/products/:id"
          element={
            <ProtectedRoute adminOnly>
              <AdminProductForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/content"
          element={
            <ProtectedRoute adminOnly>
              <AdminSiteContent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/media"
          element={
            <ProtectedRoute adminOnly>
              <AdminMedia />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/contacts"
          element={
            <ProtectedRoute adminOnly>
              <AdminContacts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/filters"
          element={
            <ProtectedRoute adminOnly>
              <AdminFilters />
            </ProtectedRoute>
          }
        />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </motion.main>
      </AnimatePresence>

      {!inAdminArea ? <SiteFooter /> : null}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App
