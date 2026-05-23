import { AnimatePresence, motion } from 'framer-motion'
import { FiCheckCircle } from 'react-icons/fi'

function ProductToast({ open, message }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 right-4 z-[80] flex max-w-[min(26rem,calc(100vw-2rem))] items-center gap-3 rounded-[1.6rem] border border-[rgba(200,169,106,0.3)] bg-[rgba(255,255,255,0.96)] px-4 py-3 text-sm font-medium text-[#19213C] shadow-[0_22px_60px_rgba(25,33,60,0.16)] backdrop-blur-xl"
        >
          <FiCheckCircle className="text-[#C9A24A]" size={18} />
          <span>{message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default ProductToast
