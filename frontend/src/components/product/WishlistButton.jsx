import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FiHeart } from 'react-icons/fi'
import { wishlistStorage } from './wishlist'

function WishlistButton({ productId, className = '', label = 'Save to wishlist' }) {
  const [active, setActive] = useState(() => wishlistStorage.has(productId))

  useEffect(() => {
    setActive(wishlistStorage.has(productId))
  }, [productId])

  useEffect(() => {
    const sync = () => setActive(wishlistStorage.has(productId))
    window.addEventListener('wishlistchange', sync)
    return () => window.removeEventListener('wishlistchange', sync)
  }, [productId])

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      whileHover={{ y: -1, scale: 1.02 }}
      aria-pressed={active}
      aria-label={label}
      onClick={() => {
        const next = wishlistStorage.toggle(productId)
        setActive(next.includes(String(productId || '')))
      }}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${
        active
          ? 'border-[#C8A96A] bg-[rgba(200,169,106,0.14)] text-[#C9A24A] shadow-[0_14px_36px_rgba(200,169,106,0.18)]'
          : 'border-[rgba(25,33,60,0.12)] bg-white/88 text-[#20263A] hover:border-[rgba(200,169,106,0.48)] hover:bg-white'
      } ${className}`}
    >
      <motion.span animate={active ? { scale: [1, 1.28, 1] } : { scale: 1 }} transition={{ duration: 0.35 }}>
        <FiHeart className={active ? 'fill-current' : ''} size={18} />
      </motion.span>
    </motion.button>
  )
}

export default WishlistButton
