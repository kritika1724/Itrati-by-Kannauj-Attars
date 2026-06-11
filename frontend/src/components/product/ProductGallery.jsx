import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import { getResponsiveImageProps } from '../../utils/media'
import { clampImageZoom, getProductImages } from './productPresentation'

function ProductGallery({ product, spotlightLabel = 'Itrati' }) {
  const images = useMemo(() => getProductImages(product), [product])
  const imageZoom = clampImageZoom(product?.imageZoom)
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const hasImages = images.length > 0
  const currentImage = hasImages ? images[activeIndex] || images[0] : ''
  const currentImageProps = currentImage
    ? getResponsiveImageProps(currentImage, {
        assetBase: import.meta.env.VITE_API_ASSET,
        widths: [480, 640, 820, 1080, 1360, 1600],
        sizes: '(max-width: 1023px) 100vw, 48vw',
        width: 1080,
      })
    : null

  const goTo = (index) => {
    if (!images.length) return
    const total = images.length
    const next = (index + total) % total
    setActiveIndex(next)
  }

  const handleTouchStart = (event) => {
    touchStartX.current = event.changedTouches[0]?.clientX || 0
  }

  const handleTouchEnd = (event) => {
    touchEndX.current = event.changedTouches[0]?.clientX || 0
    const delta = touchStartX.current - touchEndX.current
    if (Math.abs(delta) < 36) return
    if (delta > 0) goTo(activeIndex + 1)
    else goTo(activeIndex - 1)
  }

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[2rem] border border-[rgba(25,33,60,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(250,246,239,0.98))] p-3 shadow-[0_28px_80px_rgba(25,33,60,0.10)] sm:p-5">
        <div className="pointer-events-none absolute inset-x-[15%] top-6 h-40 rounded-full bg-[radial-gradient(circle,rgba(200,169,106,0.28),transparent_68%)] blur-2xl" />
        <div className="pointer-events-none absolute inset-x-[18%] bottom-8 h-16 rounded-full bg-[radial-gradient(circle,rgba(25,33,60,0.18),transparent_70%)] blur-xl" />

        <div className="relative overflow-hidden rounded-[1.6rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,239,229,0.96))]">
          <div className="pointer-events-none absolute inset-x-10 bottom-5 h-8 rounded-full bg-[radial-gradient(circle,rgba(25,33,60,0.16),transparent_75%)] blur-lg" />
          <div
            className="relative flex aspect-[4/4.4] items-center justify-center overflow-hidden sm:aspect-[4/4.1] lg:aspect-[5/5.2]"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              {currentImageProps ? (
                <motion.img
                  key={currentImage}
                  {...currentImageProps}
                  alt={product?.name}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: imageZoom }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full w-full object-cover object-center transition duration-700 md:hover:brightness-[1.02]"
                  loading={activeIndex === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={activeIndex === 0 ? 'high' : 'low'}
                />
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(200,169,106,0.16),rgba(255,255,255,0.98),rgba(25,33,60,0.08))]"
                >
                  <span className="rounded-full border border-[rgba(200,169,106,0.28)] bg-white/88 px-4 py-2 text-sm font-semibold uppercase tracking-[0.28em] text-[#19213C]">
                    {spotlightLabel}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {images.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => goTo(activeIndex - 1)}
                className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/88 text-[#19213C] shadow-lg backdrop-blur sm:inline-flex"
              >
                <FiChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => goTo(activeIndex + 1)}
                className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/88 text-[#19213C] shadow-lg backdrop-blur sm:inline-flex"
              >
                <FiChevronRight size={18} />
              </button>
            </>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8D7667]">Gallery</p>
            <p className="mt-1 text-sm text-[#5F6475]">Swipe on mobile or use thumbnails for a closer look.</p>
          </div>
          {images.length > 1 ? (
            <span className="rounded-full border border-[rgba(25,33,60,0.08)] bg-white px-3 py-1 text-xs font-semibold text-[#19213C]">
              {activeIndex + 1} / {images.length}
            </span>
          ) : null}
        </div>
      </div>

      {images.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
          {images.map((image, index) => {
            const active = index === activeIndex
            const thumbnailImage = getResponsiveImageProps(image, {
              assetBase: import.meta.env.VITE_API_ASSET,
              widths: [96, 144, 192, 240],
              sizes: '96px',
              width: 192,
            })
            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative min-w-[4.8rem] overflow-hidden rounded-[1.25rem] border bg-white transition sm:min-w-[5.5rem] ${
                  active
                    ? 'border-[rgba(200,169,106,0.58)] shadow-[0_14px_36px_rgba(200,169,106,0.18)]'
                    : 'border-[rgba(25,33,60,0.08)] hover:border-[rgba(200,169,106,0.36)]'
                }`}
              >
                <div className="aspect-square w-20 sm:w-24">
                  <img
                    {...thumbnailImage}
                    alt={`${product?.name} ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                {active ? <span className="absolute inset-x-3 bottom-2 h-0.5 rounded-full bg-[#C9A24A]" /> : null}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default ProductGallery
