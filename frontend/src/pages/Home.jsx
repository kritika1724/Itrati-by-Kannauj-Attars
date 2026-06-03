import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiAward,
  FiMail,
  FiPhone,
  FiUser,
} from 'react-icons/fi'
import AdminAssetImage from '../components/AdminAssetImage'
import RecentlyViewedStrip from '../components/RecentlyViewedStrip'
import { useSiteAssets } from '../components/SiteAssetsProvider'
import { BUSINESS } from '../config/business'
import { useSiteContactProfile } from '../hooks/useSiteContentBlocks'
import { fadeLeft, fadeUp, heroStagger, revealCard, staggerGrid, viewportOnce } from '../lib/motion'
import { auth } from '../services/api'
import { toAssetUrl } from '../utils/media'

const collectionCards = [
  {
    title: 'Premium Attars Collection',
    copy: 'Signature attars with elegant projection, polished depth, and a distinctly Kannauj soul.',
    assetKey: 'home.explore.signature',
    link: '/collections/signature',
    cta: 'Explore attars',
  },
  {
    title: 'Essential Oils',
    copy: 'Steam-distilled oils and floral waters shaped for ritual, wellness, gifting, and formulation.',
    assetKey: 'home.story.botanicals',
    link: '/products?purpose=skin_hair',
    cta: 'View essential oils',
  },
  {
    title: 'Heritage Collection',
    copy: 'Deeper traditional profiles inspired by Deg-Bhapka craft, slow maturation, and perfume memory.',
    assetKey: 'home.explore.heritage',
    link: '/collections/heritage',
    cta: 'View heritage line',
  },
]

const heritagePillars = [
  {
    title: 'Generational perfumery',
    copy: 'From Sundar Lal Suraj Narayan to Laxmi Narayan Trivedi and onward, the craft has moved through the family with care.',
  },
  {
    title: 'Kannauj, the perfume city',
    copy: 'Every blend stays tied to a city known for roses, kewra, mitti attar, and one of India’s oldest fragrance traditions.',
  },
  {
    title: 'GI-tagged authenticity',
    copy: 'The legacy is protected by Geographical Indication recognition, reinforcing a genuine connection to place and method.',
  },
]

const distillationNotes = [
  {
    title: 'Flower selection',
    copy: 'Fresh botanicals are chosen around season, aroma profile, and the softness needed for a balanced attar.',
  },
  {
    title: 'Deg-Bhapka process',
    copy: 'Copper stills, steam pressure, and slow condensation preserve floral depth while keeping the extraction graceful.',
  },
  {
    title: 'Maturation and balance',
    copy: 'The distillate is allowed to settle so the fragrance develops rounded edges, clarity, and long wear.',
  },
]

const clientVoices = [
  {
    title: 'Luxury gifting houses',
    quote: 'Clients look for fragrance stories that feel rooted, refined, and distinctly Indian — that is where Itrati feels different.',
  },
  {
    title: 'Wellness and ritual buyers',
    quote: 'Soft floral waters, calming oils, and nostalgic earth notes make the range feel personal rather than generic.',
  },
  {
    title: 'Trade and bulk partners',
    quote: 'Consistency, dependable communication, and heritage trust matter just as much as the fragrance itself.',
  },
]

function Home() {
  const { assets, uploadAndSetAsset } = useSiteAssets()
  const contactProfile = useSiteContactProfile()
  const [user, setUser] = useState(auth.getUser())
  const heroVideoRef = useRef(null)
  const [videoBusy, setVideoBusy] = useState(false)
  const [videoMessage, setVideoMessage] = useState('')
  const [deferredReady, setDeferredReady] = useState(false)
  const isAdmin = user?.isAdmin === true
  const homeVideo = assets?.['home.top.video']
    ? toAssetUrl(assets['home.top.video'], import.meta.env.VITE_API_ASSET)
    : ''

  useEffect(() => {
    const onAuth = () => setUser(auth.getUser())
    window.addEventListener('authchange', onAuth)
    return () => window.removeEventListener('authchange', onAuth)
  }, [])

  useEffect(() => {
    let timer = 0
    let cancelled = false
    let idleHandle = 0

    const revealDeferred = () => {
      if (!cancelled) setDeferredReady(true)
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleHandle = window.requestIdleCallback(revealDeferred, { timeout: 900 })
      timer = window.setTimeout(revealDeferred, 950)
    } else {
      timer = window.setTimeout(revealDeferred, 220)
    }

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      if (typeof window !== 'undefined' && 'cancelIdleCallback' in window && idleHandle) {
        window.cancelIdleCallback(idleHandle)
      }
    }
  }, [])

  useEffect(() => {
    const video = heroVideoRef.current
    if (!video || !homeVideo) return undefined

    const ensurePlayback = () => {
      video.muted = true
      video.defaultMuted = true
      video.loop = true
      video.playsInline = true
      if (document.visibilityState === 'hidden') return
      const playPromise = video.play()
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {})
      }
    }

    ensurePlayback()
    video.addEventListener('loadedmetadata', ensurePlayback)
    video.addEventListener('canplay', ensurePlayback)
    window.addEventListener('pageshow', ensurePlayback)
    document.addEventListener('visibilitychange', ensurePlayback)

    return () => {
      video.removeEventListener('loadedmetadata', ensurePlayback)
      video.removeEventListener('canplay', ensurePlayback)
      window.removeEventListener('pageshow', ensurePlayback)
      document.removeEventListener('visibilitychange', ensurePlayback)
    }
  }, [homeVideo])

  const uploadHomeBackgroundVideo = async (file) => {
    setVideoBusy(true)
    setVideoMessage('')
    try {
      await uploadAndSetAsset('home.top.video', file)
      setVideoMessage('Background video updated.')
    } catch (e) {
      setVideoMessage(e.message || 'Video upload failed.')
    } finally {
      setVideoBusy(false)
    }
  }

  return (
    <div className="relative min-h-screen text-ink">
      <div aria-hidden="true" className="pointer-events-none sticky top-0 z-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-0 origin-center">
          {homeVideo ? (
            <video
              ref={heroVideoRef}
              src={homeVideo}
              className="ka-hero-video pointer-events-none h-full w-full select-none object-cover object-center"
              autoPlay
              muted
              defaultMuted
              loop
              playsInline
              controls={false}
              disablePictureInPicture
              disableRemotePlayback
              tabIndex={-1}
              preload="metadata"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_28%_18%,rgba(232,208,176,0.26),transparent_30%),radial-gradient(circle_at_72%_26%,rgba(255,255,255,0.14),transparent_34%),linear-gradient(140deg,#1C140F_0%,#5A4430_36%,#C19A61_82%,#F6EFE5_100%)]" />
          )}
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,16,36,0.42)_0%,rgba(9,20,45,0.38)_34%,rgba(10,22,48,0.56)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(7,16,36,0.30),transparent_28%),radial-gradient(circle_at_top,rgba(171,222,255,0.18),transparent_34%),linear-gradient(180deg,rgba(255,250,244,0.02)_0%,rgba(255,250,244,0.04)_30%,rgba(255,250,244,0.10)_68%,rgba(255,250,244,0.16)_100%)]" />
        <div className="ka-mist-layer absolute inset-x-0 bottom-0 h-56 opacity-90" />
        <div className="ka-mist-layer ka-mist-layer-alt absolute inset-x-0 bottom-10 h-44 opacity-55" />
      </div>

      {isAdmin ? (
        <div className="fixed bottom-5 right-5 z-50 max-w-[calc(100vw-2rem)] rounded-[1.6rem] border border-white/20 bg-[rgba(19,13,9,0.82)] p-3 text-white shadow-[0_24px_70px_rgba(8,5,2,0.38)] backdrop-blur-xl">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.24em] text-white/85">
            Hero video
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/ogg,video/x-m4v,.mp4,.webm,.mov,.m4v,.ogg"
              disabled={videoBusy}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) uploadHomeBackgroundVideo(file)
              }}
              className="mt-2 block w-full max-w-xs text-[11px] text-white file:mr-3 file:rounded-full file:border-0 file:bg-white/90 file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:text-ink hover:file:bg-white disabled:opacity-60"
            />
          </label>
          {videoMessage ? <p className="mt-2 text-[11px] font-semibold text-white/90">{videoMessage}</p> : null}
        </div>
      ) : null}

      <div className="relative z-10 -mt-[100svh]">
      <section id="top" className="relative z-10 min-h-[100svh]">
        <div className="ka-container relative z-10 flex min-h-[100svh] flex-col justify-center py-16 sm:py-24">
          <motion.div
            variants={heroStagger}
            initial="hidden"
            animate="show"
            className="relative mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(7,16,36,0.34),rgba(7,16,36,0.16))] px-5 py-7 text-center text-white shadow-[0_28px_90px_rgba(5,10,24,0.18)] sm:rounded-[2.8rem] sm:px-10 sm:py-10"
          >
            <div className="pointer-events-none absolute inset-x-6 top-1/2 h-[28rem] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(7,16,36,0.34)_0%,rgba(7,16,36,0.14)_42%,transparent_72%)] blur-2xl" />
            <motion.p
              variants={fadeUp}
              className="relative ka-kicker !text-[#EEF6FF] drop-shadow-[0_6px_18px_rgba(7,16,36,0.50)]"
            >
              {BUSINESS.heroKicker}
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="relative mt-5 font-display text-4xl leading-[0.95] tracking-[-0.04em] text-white drop-shadow-[0_14px_36px_rgba(7,16,36,0.58)] sm:text-6xl lg:text-8xl"
            >
              {BUSINESS.brandName}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="relative mt-5 font-display text-xl leading-tight text-[#F9FBFF] drop-shadow-[0_10px_28px_rgba(7,16,36,0.52)] sm:text-3xl lg:text-4xl"
            >
              {BUSINESS.heroTagline}
            </motion.p>
            <motion.p
              variants={fadeUp}
              className="relative mx-auto mt-6 max-w-3xl text-sm leading-7 text-white/92 drop-shadow-[0_8px_22px_rgba(7,16,36,0.44)] sm:mt-7 sm:text-lg sm:leading-8"
            >
              {BUSINESS.fullDisplayName} brings the art of Indian perfumery into a modern luxury expression —
              attars, floral waters, and essential oils shaped by Deg-Bhapka tradition and refined with timeless character.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link to="/collections" className="ka-btn-primary px-8 py-4 text-sm sm:text-base">
                Discover the collection
              </Link>
              <Link to="/products" className="ka-btn-primary px-8 py-4 text-sm sm:text-base">
                Explore products
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="relative mt-12 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
              <span className="rounded-full border border-white/22 bg-[rgba(7,16,36,0.24)] px-4 py-2 backdrop-blur-md">Since 1998</span>
              <span className="rounded-full border border-white/22 bg-[rgba(7,16,36,0.24)] px-4 py-2 backdrop-blur-md">GI-tagged heritage</span>
              <span className="rounded-full border border-white/22 bg-[rgba(7,16,36,0.24)] px-4 py-2 backdrop-blur-md">Kannauj crafted</span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative mt-8 self-center sm:mt-14 lg:mt-20"
          >
            <div className="rounded-[2rem] border border-white/12 bg-[rgba(255,248,238,0.12)] px-6 py-4 text-center shadow-[0_22px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-white/65">Craft pillars</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-white/88">
                <span>Attars</span>
                <span className="h-1 w-1 rounded-full bg-gold" />
                <span>Floral waters</span>
                <span className="h-1 w-1 rounded-full bg-gold" />
                <span>Essential oils</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {deferredReady ? (
      <div className="relative z-10">
        <section className="px-4 py-16 sm:px-6 sm:py-20 md:py-24">
          <div className="mx-auto w-full max-w-7xl">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              variants={fadeUp}
              className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-[rgba(255,255,255,0.84)] px-5 py-6 text-center shadow-[0_20px_60px_rgba(7,16,36,0.10)] backdrop-blur-md sm:px-6 sm:py-8"
            >
              <p className="ka-kicker !text-[#4E638A]">Premium Collections</p>
              <h2 className="mt-5 ka-h1 text-[clamp(2.7rem,6vw,5.2rem)] text-[#0F1E46]">
                Inspired by centuries of fragrance craftsmanship
              </h2>
              <p className="mt-6 text-base leading-8 text-[#2C446A] sm:text-lg">
                Explore signature attars, floral waters, and essential oils.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              variants={staggerGrid(0.08, 0.05)}
              className="mt-10 grid grid-cols-2 gap-4 sm:mt-14 lg:grid-cols-3 lg:gap-6"
            >
              {collectionCards.map((card) => (
                <motion.article
                  key={card.title}
                  variants={revealCard}
                  className="ka-shine-card rounded-[1.6rem] border border-white/70 bg-white/82 p-3.5 shadow-[0_26px_90px_rgba(28,19,13,0.08)] backdrop-blur-xl sm:rounded-[2.2rem] sm:p-5"
                >
                  <AdminAssetImage
                    assetKey={card.assetKey}
                    className="ka-frame aspect-[1/1.12] w-full rounded-[1.25rem] bg-[linear-gradient(140deg,rgba(235,220,197,0.78),rgba(255,255,255,0.99),rgba(112,85,58,0.08))] sm:aspect-[4/5] sm:rounded-[1.8rem]"
                    imgClassName="p-2"
                    defaultAspect="4 / 5"
                    fit="cover"
                  />
                  <div className="mt-4 sm:mt-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4E638A] sm:text-[11px] sm:tracking-[0.28em]">Collection</p>
                    <h3 className="mt-2 text-base font-semibold leading-snug tracking-[-0.03em] text-ink sm:mt-3 sm:text-2xl">{card.title}</h3>
                    <p className="mt-2 text-[11px] leading-5 text-[#304A72] sm:mt-4 sm:text-sm sm:leading-7">{card.copy}</p>
                  </div>
                  <Link
                    to={card.link}
                    className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1F3E73] transition hover:text-ink sm:mt-6 sm:gap-2 sm:text-sm"
                  >
                    {card.cta}
                    <span aria-hidden="true">→</span>
                  </Link>
                </motion.article>
              ))}
            </motion.div>

          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 md:py-24">
          <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1fr_0.92fr]">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              variants={fadeLeft}
              className="lg:sticky lg:top-28 h-fit overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,#1C140F,#120C08)] p-5 text-white shadow-[0_40px_120px_rgba(15,9,5,0.44)] sm:rounded-[2.4rem] sm:p-8"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(200,163,104,0.20),rgba(200,163,104,0)_46%)]" />
              <div className="relative">
                <p className="ka-kicker !text-white/58">Traditional Deg Bhapka Distillation</p>
                <h2 className="mt-4 font-display text-3xl leading-tight text-white sm:text-4xl md:text-5xl">
                  The slow craft behind every drop.
                </h2>
                <p className="mt-5 max-w-xl text-[13px] leading-7 text-white/72 sm:text-base sm:leading-8">
                  {BUSINESS.craftNote}
                </p>

                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-3 backdrop-blur-md sm:mt-8 sm:rounded-[2rem]">
                  <AdminAssetImage
                    assetKey="home.story.distillation"
                    className="aspect-[16/10] w-full rounded-[1.5rem] border border-white/10 bg-[linear-gradient(135deg,rgba(200,163,104,0.18),rgba(255,255,255,0.08),rgba(255,255,255,0.02))]"
                    imgClassName="p-2"
                    defaultAspect="16 / 10"
                    fit="cover"
                  />
                </div>

                <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/75 sm:mt-8 sm:gap-3 sm:text-[11px] sm:tracking-[0.22em]">
                  <span className="rounded-full border border-white/14 bg-white/6 px-4 py-2">Copper stills</span>
                  <span className="rounded-full border border-white/14 bg-white/6 px-4 py-2">Slow condensation</span>
                  <span className="rounded-full border border-white/14 bg-white/6 px-4 py-2">Balanced maturation</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              variants={staggerGrid(0.1, 0.05)}
              className="space-y-5"
            >
              {distillationNotes.map((item, index) => (
                <motion.article
                  key={item.title}
                  variants={revealCard}
                  className="rounded-[1.7rem] border border-white/70 bg-[rgba(255,255,255,0.90)] p-5 shadow-[0_24px_70px_rgba(11,20,48,0.08)] backdrop-blur-xl sm:rounded-[2rem] sm:p-7"
                >
                  <div className="flex items-center gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(145deg,#F2DE9A,#C9A24A)] text-sm font-semibold text-midnight">
                      0{index + 1}
                    </span>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted sm:text-[11px] sm:tracking-[0.28em]">Process</p>
                      <h3 className="mt-1 text-xl font-semibold text-ink sm:text-2xl">{item.title}</h3>
                    </div>
                  </div>
                  <p className="mt-4 text-[13px] leading-7 text-muted sm:mt-5 sm:text-base sm:leading-8">{item.copy}</p>
                </motion.article>
              ))}

              <motion.div variants={revealCard} className="rounded-[1.7rem] border border-gold/15 bg-[linear-gradient(135deg,rgba(247,238,226,0.94),rgba(255,255,255,0.86))] p-5 shadow-[0_20px_65px_rgba(18,12,8,0.05)] sm:rounded-[2rem] sm:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted sm:text-[11px] sm:tracking-[0.28em]">Why this matters</p>
                <p className="mt-4 text-base leading-7 text-ink sm:text-lg sm:leading-8">
                  Slow distillation gives attars their softness, diffusion, and memory. The fragrance does not shout — it unfolds.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>


        <section id="our-story" className="px-4 py-16 sm:px-6 sm:py-20 md:py-24">
          <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr]">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              variants={fadeLeft}
              className="ka-shine-card lg:sticky lg:top-28 h-fit rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.90),rgba(246,249,255,0.82))] p-6 shadow-[0_28px_90px_rgba(7,16,36,0.12)] backdrop-blur-md sm:rounded-[2.25rem] sm:p-8"
            >
              <p className="ka-kicker !text-[#6A7EA6]">Our Story</p>
              <h2 className="mt-5 ka-h1 max-w-xl text-[clamp(2.7rem,6vw,5.5rem)] text-[#0F1E46]">
                A generational perfume story from Kannauj.
              </h2>
              <p className="mt-6 max-w-lg text-sm leading-7 text-[#39527F] sm:text-lg sm:leading-8">
                {BUSINESS.legacyIntro}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full border border-[#D4DDEE] bg-white/95 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#0F1E46] shadow-sm">
                  Family legacy
                </span>
                <span className="rounded-full border border-[#D4DDEE] bg-white/95 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#0F1E46] shadow-sm">
                  Premium Indian attars
                </span>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              variants={staggerGrid(0.09, 0.04)}
              className="space-y-6"
            >
              {heritagePillars.map((item, index) => (
                <motion.article
                  key={item.title}
                  variants={revealCard}
                  className="ka-shine-card rounded-[1.7rem] border border-white/70 bg-white/78 p-5 shadow-[0_24px_80px_rgba(28,19,13,0.08)] backdrop-blur-xl sm:rounded-[2rem] sm:p-7"
                >
                  <div className="flex items-center gap-4">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/30 bg-gold/12 text-sm font-semibold text-[#0F1E46]">
                      0{index + 1}
                    </span>
                    <h3 className="text-xl font-semibold tracking-[-0.02em] text-ink sm:text-2xl">{item.title}</h3>
                  </div>
                  <p className="mt-4 text-[13px] leading-7 text-[#445D89] sm:text-base">{item.copy}</p>
                </motion.article>
              ))}

              <motion.div variants={revealCard} className="grid grid-cols-2 gap-3 sm:gap-4">
                {BUSINESS.legacyTimeline.map((item) => (
                  <div
                    key={`${item.year}-${item.title}`}
                    className="rounded-[1.3rem] border border-gold/20 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(247,240,229,0.92))] p-4 shadow-[0_20px_60px_rgba(11,20,48,0.06)] sm:rounded-[1.8rem] sm:p-6"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6A7EA6] sm:text-[11px] sm:tracking-[0.28em]">{item.year}</p>
                    <h3 className="mt-2 text-sm font-semibold leading-snug text-ink sm:mt-3 sm:text-lg">{item.title}</h3>
                    <p className="mt-2 text-[11px] leading-5 text-[#445D89] sm:mt-3 sm:text-sm sm:leading-7">{item.copy}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 md:py-24">
          <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              variants={fadeLeft}
              className="rounded-[1.9rem] border border-white/75 bg-white/82 p-5 shadow-[0_28px_90px_rgba(28,19,13,0.07)] backdrop-blur-xl sm:rounded-[2.2rem] sm:p-8"
            >
              <div className="flex items-center gap-3">
                <FiUser className="text-ruby" size={22} />
                <p className="ka-kicker">Founder</p>
              </div>

              <div className="mt-5 rounded-[1.6rem] border border-gold/18 bg-[linear-gradient(135deg,rgba(249,243,234,0.84),rgba(255,255,255,0.95))] p-3 sm:mt-6 sm:rounded-[2rem]">
                <AdminAssetImage
                  assetKey="about.ceo.photo"
                  className="aspect-[4/5] w-full rounded-[1.5rem] border border-white/70 bg-white/90"
                  imgClassName="p-2"
                  defaultAspect="4 / 5"
                  fit="contain"
                />
              </div>

              <h3 className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-ink sm:mt-6 sm:text-3xl">{BUSINESS.founder}</h3>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.22em] text-ruby">
                Founder, {BUSINESS.firmName}
              </p>
              <p className="mt-4 text-[13px] leading-7 text-muted sm:text-sm sm:leading-8">
                President, The Attars & Perfumers Association Kannauj — guiding the brand with craft authority, regional leadership, and active participation in the wider perfume community.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/ceo" className="ka-btn-outline px-6 py-3">
                  Know about CEO
                </Link>
                <Link to="/contact" className="ka-btn-primary px-6 py-3">
                  Request a consultation
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              variants={staggerGrid(0.08, 0.04)}
              className="space-y-4 sm:space-y-6"
            >
              <motion.div variants={revealCard} className="rounded-[1.9rem] border border-white/75 bg-[linear-gradient(135deg,rgba(255,252,246,0.94),rgba(246,236,220,0.84))] p-6 shadow-[0_28px_90px_rgba(28,19,13,0.07)] sm:rounded-[2.2rem] sm:p-8">
                <div className="flex items-center gap-3">
                  <FiAward className="text-ruby" size={22} />
                  <p className="ka-kicker">Association</p>
                </div>
                <div className="mt-6 grid gap-3">
                  {BUSINESS.associations.map((association) => (
                    <div
                      key={`${association.name}-${association.location}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-white/80 bg-white/76 px-5 py-4"
                    >
                      <p className="text-sm font-semibold text-ink">{association.name}</p>
                      {association.location ? (
                        <span className="rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ruby">
                          {association.location}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={revealCard} className="rounded-[1.9rem] border border-[#d8c4a3]/30 bg-[linear-gradient(160deg,#20140F_0%,#130C08_100%)] p-6 text-white shadow-[0_34px_110px_rgba(15,10,7,0.42)] sm:rounded-[2.2rem] sm:p-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="ka-kicker !text-white/58">Business details</p>
                    <p className="mt-4 text-lg font-semibold text-white">{BUSINESS.displayFirmName}</p>
                    <p className="mt-3 text-sm leading-7 text-white/72">
                      Private enterprise rooted in Kannauj, serving both personal fragrance buyers and bulk or trade requirements.
                    </p>
                  </div>
                  <div className="space-y-4 text-sm font-semibold text-white/86">
                    <a href={`mailto:${contactProfile.emails[0]}`} className="flex items-center gap-3 hover:text-white">
                      <FiMail size={18} />
                      {contactProfile.emails[0]}
                    </a>
                    {contactProfile.phones.map((phone) => (
                      <a key={phone} href={`tel:${phone.replace(/\s+/g, '')}`} className="flex items-center gap-3 hover:text-white">
                        <FiPhone size={18} />
                        {phone}
                      </a>
                    ))}
                  </div>
                </div>
              </motion.div>

              <motion.div
                variants={revealCard}
                className="overflow-hidden rounded-[2.2rem] border border-white/75 bg-white/82 p-3 shadow-[0_24px_80px_rgba(28,19,13,0.07)] backdrop-blur-xl"
              >
                <AdminAssetImage
                  assetKey="home.credibility.photo"
                  className="w-full rounded-[1.6rem] border border-white/70 bg-[linear-gradient(140deg,rgba(243,235,223,0.72),rgba(255,255,255,0.96),rgba(17,27,58,0.08))]"
                  imgClassName="p-2"
                  defaultAspect="4 / 3"
                  fit="cover"
                />
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 sm:py-20 md:py-24">
          <div className="mx-auto w-full max-w-7xl">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              variants={fadeUp}
              className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-[rgba(255,255,255,0.84)] px-5 py-6 text-center shadow-[0_20px_60px_rgba(7,16,36,0.10)] backdrop-blur-md sm:px-6 sm:py-8"
            >
              <p className="ka-kicker !text-[#4E638A]">Luxury Testimonials</p>
              <h2 className="mt-5 ka-h1 text-[clamp(2.6rem,5.8vw,5rem)] text-[#0F1E46]">Emotion first. Elegance always.</h2>
              <p className="mt-6 text-base leading-8 text-[#2C446A] sm:text-lg">
                What keeps buyers returning is not just the scent — it is the calm, finish, and heritage behind it.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              variants={staggerGrid(0.08, 0.05)}
              className="mt-10 grid grid-cols-2 gap-4 sm:mt-12 lg:grid-cols-3 lg:gap-6"
            >
              {clientVoices.map((item) => (
                <motion.article
                  key={item.title}
                  variants={revealCard}
                  className="rounded-[1.7rem] border border-white/75 bg-white/82 p-5 shadow-[0_24px_80px_rgba(28,19,13,0.07)] backdrop-blur-xl sm:rounded-[2rem] sm:p-7"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#4E638A] sm:text-[11px] sm:tracking-[0.28em]">{item.title}</p>
                  <p className="mt-4 font-display text-lg leading-7 text-ink sm:mt-5 sm:text-2xl sm:leading-10">“{item.quote}”</p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </section>

        <motion.section
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={fadeUp}
          className="px-4 pb-8 sm:px-6 sm:pb-10"
        >
          <div className="mx-auto w-full max-w-7xl rounded-[2.3rem] border border-[#d9c2a0]/32 bg-[linear-gradient(135deg,rgba(34,23,16,0.96),rgba(89,66,45,0.96))] p-8 text-white shadow-[0_34px_110px_rgba(15,10,7,0.44)] sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="ka-kicker !text-white/58">For personal luxury and trade supply</p>
                <h2 className="mt-4 font-display text-4xl leading-tight text-white md:text-5xl">
                  Ancient Indian fragrance heritage, presented with a modern luxury eye.
                </h2>
                <p className="mt-5 max-w-3xl text-sm leading-8 text-white/72 sm:text-base">
                  Whether you are discovering a personal attar, sourcing floral waters, or looking for dependable trade support, {BUSINESS.fullDisplayName} brings the city’s legacy forward with restraint and refinement.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/products" className="ka-btn-primary px-7 py-4">
                  Shop products
                </Link>
                <Link to="/contact" className="ka-btn-darkOutline px-7 py-4">
                  Contact for bulk
                </Link>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="bg-white/50 backdrop-blur-sm">
          <RecentlyViewedStrip />
        </div>

      </div>
      ) : (
        <div className="relative z-10 px-6 pb-20">
          <div className="mx-auto w-full max-w-7xl rounded-[2rem] border border-white/16 bg-[rgba(255,255,255,0.12)] px-6 py-6 text-center text-white/88 shadow-[0_18px_60px_rgba(5,10,24,0.14)]">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/70">Loading the Kannauj story</p>
            <div className="mx-auto mt-4 h-2 w-28 overflow-hidden rounded-full bg-white/12">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-white/55" />
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default Home
