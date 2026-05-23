import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiChevronDown } from 'react-icons/fi'

function ProductAccordion({ items = [], defaultOpen = 0 }) {
  const [openIndex, setOpenIndex] = useState(defaultOpen)

  return (
    <div className="overflow-hidden rounded-[2rem] border border-[rgba(25,33,60,0.08)] bg-white/88 shadow-[0_18px_50px_rgba(25,33,60,0.06)] backdrop-blur-sm">
      {items.map((item, index) => {
        const isOpen = openIndex === index
        return (
          <div key={item.title} className={index > 0 ? 'border-t border-[rgba(25,33,60,0.08)]' : ''}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C6C62]">Details</p>
                <h3 className="mt-2 text-lg font-semibold text-[#19213C]">{item.title}</h3>
              </div>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.24 }}>
                <FiChevronDown className="text-[#19213C]" size={18} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 text-sm leading-7 text-[#5F6475] sm:px-6 sm:pb-6">
                    {Array.isArray(item.content) ? (
                      <ul className="space-y-2">
                        {item.content.map((line) => (
                          <li key={line} className="flex gap-3">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#C8A96A]" />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>{item.content}</p>
                    )}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

export default ProductAccordion
