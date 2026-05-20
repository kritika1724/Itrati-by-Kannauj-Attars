import { BrowserRouter, Routes, Route, NavLink, Navigate, Link, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Suspense, lazy, useEffect, useState } from 'react'
import { auth } from './services/api'
import { FiMenu, FiX } from 'react-icons/fi'
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion'

import ProtectedRoute from './components/ProtectedRoute'
import LogoMark from './components/LogoMark'
import CursorGlow from './components/CursorGlow'
import { BUSINESS } from './config/business'
import { pageShell } from './lib/motion'

const Home = lazy(() => import('./pages/Home'))
const Collections = lazy(() => import('./pages/Collections'))
const Contact = lazy(() => import('./pages/Contact'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const TrackOrder = lazy(() => import('./pages/TrackOrder'))
const Account = lazy(() => import('./pages/Account'))
const OAuthCallback = lazy(() => import('./pages/OAuthCallback'))
const NotFound = lazy(() => import('./pages/NotFound'))
const CustomBlends = lazy(() => import('./pages/CustomBlends'))
const Signature = lazy(() => import('./pages/collections/Signature'))
const Heritage = lazy(() => import('./pages/collections/Heritage'))
const PurposeCollection = lazy(() => import('./pages/collections/PurposeCollection'))
const Gallery = lazy(() => import('./pages/Gallery'))
const CreateBlend = lazy(() => import('./pages/CreateBlend'))
const DiscoveryQuiz = lazy(() => import('./pages/DiscoveryQuiz'))
const Knowledge = lazy(() => import('./pages/Knowledge'))
const KnowledgeArticle = lazy(() => import('./pages/KnowledgeArticle'))
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
  const [user, setUser] = useState(auth.getUser())
  const isAdmin = user?.isAdmin === true
  const isLoggedIn = !!user
  const [mobileOpen, setMobileOpen] = useState(false)
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
        <header className="ka-nav-shell sticky top-0 z-20 relative border-b border-white/45 bg-[linear-gradient(180deg,rgba(255,250,244,0.76),rgba(255,250,244,0.58))] shadow-[0_18px_50px_rgba(37,25,16,0.10)] backdrop-blur-2xl">
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
              <LogoMark />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-display text-xl tracking-wide text-ink sm:text-2xl">
                  {BUSINESS.displayName}
                </span>
                <span className="truncate text-xs uppercase tracking-[0.3em] text-muted">
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
              className="md:hidden inline-flex items-center justify-center rounded-2xl border border-gold/35 bg-[rgba(255,250,244,0.56)] px-3 py-3 text-emberDark shadow-sm transition hover:border-gold/60 hover:bg-[rgba(200,169,106,0.20)]"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <FiX size={18} /> : <FiMenu size={18} />}
            </button>
          </div>

          <AnimatePresence>
            {mobileOpen ? (
              <>
                <motion.button
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-10 bg-black/40 backdrop-blur-[2px]"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                />
                <motion.div
                  id="mobile-nav"
                  initial={{ opacity: 0, y: -18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="md:hidden absolute inset-x-0 top-full z-20 border-b border-gold/30 bg-[linear-gradient(180deg,rgba(200,169,106,0.22),rgba(255,250,244,0.94))] shadow-soft backdrop-blur-xl"
                >
                  <div className="ka-container py-4">
                    <div className="grid gap-2">
                      <NavLink to="/" end className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                        Home
                      </NavLink>
                      <NavLink to="/products" className={mobileNavLinkClass} onClick={() => setMobileOpen(false)}>
                        Products
                      </NavLink>

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
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/collections/purpose/:purposeId" element={<PurposeCollection />} />
        <Route path="/collections/signature" element={<Signature />} />
        <Route path="/collections/heritage" element={<Heritage />} />
        <Route path="/custom-blends" element={<CustomBlends />} />
        <Route path="/create-blend" element={<CreateBlend />} />
        <Route path="/discovery-quiz" element={<DiscoveryQuiz />} />
        <Route path="/knowledge" element={<Knowledge />} />
        <Route path="/knowledge/:slug" element={<KnowledgeArticle />} />
        <Route path="/ceo" element={<Ceo />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/account" element={<Account />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />

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
