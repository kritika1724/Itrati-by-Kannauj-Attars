import { motion } from 'framer-motion'
import ProductCard from '../ProductCard'
import { revealCard, staggerGrid } from '../../lib/motion'

function ProductGrid({ products = [], loading = false, isAdmin = false, onView, onAdd, onQuickView }) {
  if (loading && products.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-[1.75rem] border border-[rgba(25,33,60,0.08)] bg-white/92 p-4 shadow-[0_18px_48px_rgba(25,33,60,0.06)]"
          >
            <div className="aspect-[4/4.1] animate-pulse rounded-[1.4rem] bg-[rgba(226,217,203,0.48)]" />
            <div className="mt-5 h-5 w-2/3 animate-pulse rounded-full bg-[rgba(226,217,203,0.44)]" />
            <div className="mt-3 h-3 w-1/2 animate-pulse rounded-full bg-[rgba(226,217,203,0.34)]" />
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="h-11 animate-pulse rounded-full bg-[rgba(226,217,203,0.4)]" />
              <div className="h-11 animate-pulse rounded-full bg-[rgba(226,217,203,0.4)]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerGrid(0.045, 0.02)}
      className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
    >
      {products.map((product) => (
        <motion.div key={product._id} variants={revealCard}>
          <ProductCard
            product={product}
            onView={() => onView?.(product)}
            onAdd={onAdd ? (payload) => onAdd(product, payload) : undefined}
            onQuickView={() => onQuickView?.(product)}
            isAdmin={isAdmin}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}

export default ProductGrid
