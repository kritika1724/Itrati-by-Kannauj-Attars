import { AnimatePresence, motion } from 'framer-motion'
import { FiSliders, FiX } from 'react-icons/fi'

function FilterSidebar({
  open,
  onClose,
  categories = [],
  selectedCategory = '',
  onSelectCategory,
  minPrice = '',
  maxPrice = '',
  onMinPriceChange,
  onMaxPriceChange,
  families = [],
  selectedFamilies = [],
  onToggleFamily,
  directions = [],
  selectedDirections = [],
  onToggleDirection,
  seasons = [],
  selectedSeasons = [],
  onToggleSeason,
  genders = [],
  selectedGenders = [],
  onToggleGender,
  occasions = [],
  selectedOccasions = [],
  onToggleOccasion,
  bestSellerOnly = false,
  onToggleBestSeller,
  onClear,
  activeCount = 0,
  resultLabel = 'View products',
}) {
  const content = (
    <div className="flex h-full max-h-[min(92svh,860px)] flex-col overflow-hidden rounded-t-[2rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.995),rgba(252,249,243,0.985))] shadow-[0_32px_90px_rgba(25,33,60,0.16)] overscroll-contain md:max-h-[min(80vh,780px)] md:rounded-[2rem] md:border md:border-[rgba(25,33,60,0.08)]">
      <div className="flex justify-center pt-3 md:hidden">
        <span className="h-1.5 w-14 rounded-full bg-[rgba(25,33,60,0.12)]" />
      </div>

      <div className="flex items-start justify-between gap-4 border-b border-[rgba(25,33,60,0.08)] px-5 py-5 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">Filter & refine</p>
          <h3 className="mt-2 text-xl font-semibold text-[#19213C]">Curate your fragrance view</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeCount > 0 ? (
              <span className="inline-flex items-center rounded-full bg-[rgba(25,33,60,0.08)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#19213C]">
                {activeCount} active
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-[rgba(25,33,60,0.05)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B6F7A]">
                No filters yet
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(25,33,60,0.10)] bg-white text-[#19213C] transition hover:border-[rgba(200,169,106,0.48)]"
        >
          <FiX size={18} />
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">Popular picks</p>
            <button
              type="button"
              onClick={onToggleBestSeller}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                bestSellerOnly
                  ? 'bg-[rgba(200,169,106,0.18)] text-[#C9A24A]'
                  : 'bg-[rgba(25,33,60,0.06)] text-[#47506A]'
              }`}
            >
              {bestSellerOnly ? 'Bestseller on' : 'Bestseller off'}
            </button>
          </div>
          <button
            type="button"
            onClick={onToggleBestSeller}
            className={`flex w-full items-center justify-between rounded-[1.4rem] border px-4 py-4 text-left transition ${
              bestSellerOnly
                ? 'border-[rgba(200,169,106,0.4)] bg-[rgba(200,169,106,0.10)]'
                : 'border-[rgba(25,33,60,0.08)] bg-white hover:border-[rgba(200,169,106,0.3)]'
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-[#19213C]">Only bestselling products</p>
              <p className="mt-1 text-xs text-[#6B6F7A]">See the most-loved attars, oils, and floral waters first.</p>
            </div>
            <span className={`h-5 w-5 rounded-full border ${bestSellerOnly ? 'border-[#C8A96A] bg-[#C8A96A]' : 'border-[rgba(25,33,60,0.18)] bg-white'}`} />
          </button>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">Category</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelectCategory('')}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                !selectedCategory
                  ? 'border-[rgba(200,169,106,0.44)] bg-[rgba(200,169,106,0.12)] text-[#C9A24A]'
                  : 'border-[rgba(25,33,60,0.08)] bg-white text-[#19213C] hover:border-[rgba(200,169,106,0.3)]'
              }`}
            >
              All
            </button>
            {categories.map((category) => {
              const active = selectedCategory === category
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => onSelectCategory(category)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? 'border-[rgba(200,169,106,0.44)] bg-[rgba(200,169,106,0.12)] text-[#C9A24A]'
                      : 'border-[rgba(25,33,60,0.08)] bg-white text-[#19213C] hover:border-[rgba(200,169,106,0.3)]'
                  }`}
                >
                  {category}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">Price range</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="rounded-[1.4rem] border border-[rgba(25,33,60,0.08)] bg-white px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D7667]">Min</span>
              <input
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => onMinPriceChange(e.target.value)}
                placeholder="0"
                className="mt-2 w-full bg-transparent text-sm font-semibold text-[#19213C] outline-none placeholder:text-[#9AA0AE]"
              />
            </label>
            <label className="rounded-[1.4rem] border border-[rgba(25,33,60,0.08)] bg-white px-4 py-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D7667]">Max</span>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(e.target.value)}
                placeholder="5000"
                className="mt-2 w-full bg-transparent text-sm font-semibold text-[#19213C] outline-none placeholder:text-[#9AA0AE]"
              />
            </label>
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">Fragrance family</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {families.map((item) => {
              const active = selectedFamilies.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleFamily(item.id)}
                  className={`flex items-center justify-between rounded-[1.4rem] border px-4 py-3 text-left transition ${
                    active
                      ? 'border-[rgba(200,169,106,0.44)] bg-[rgba(200,169,106,0.10)]'
                      : 'border-[rgba(25,33,60,0.08)] bg-white hover:border-[rgba(200,169,106,0.3)]'
                  }`}
                >
                  <span className="text-sm font-semibold text-[#19213C]">{item.label}</span>
                  <span className={`h-4 w-4 rounded-full ${active ? 'bg-[#C9A24A]' : 'bg-[rgba(25,33,60,0.12)]'}`} />
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">Fragrance direction</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {directions.map((item) => {
              const active = selectedDirections.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleDirection(item.id)}
                  className={`rounded-[1.4rem] border px-4 py-3 text-left text-sm font-semibold transition ${
                    active
                      ? 'border-[rgba(200,169,106,0.44)] bg-[rgba(200,169,106,0.10)] text-[#C9A24A]'
                      : 'border-[rgba(25,33,60,0.08)] bg-white text-[#19213C] hover:border-[rgba(200,169,106,0.3)]'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">Season</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {seasons.map((item) => {
              const active = selectedSeasons.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleSeason(item.id)}
                  className={`rounded-[1.4rem] border px-4 py-3 text-left text-sm font-semibold transition ${
                    active
                      ? 'border-[rgba(200,169,106,0.44)] bg-[rgba(200,169,106,0.10)] text-[#C9A24A]'
                      : 'border-[rgba(25,33,60,0.08)] bg-white text-[#19213C] hover:border-[rgba(200,169,106,0.3)]'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">Gender</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {genders.map((item) => {
              const active = selectedGenders.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleGender(item.id)}
                  className={`rounded-[1.4rem] border px-4 py-3 text-left text-sm font-semibold transition ${
                    active
                      ? 'border-[rgba(200,169,106,0.44)] bg-[rgba(200,169,106,0.10)] text-[#C9A24A]'
                      : 'border-[rgba(25,33,60,0.08)] bg-white text-[#19213C] hover:border-[rgba(200,169,106,0.3)]'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">Occasion</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {occasions.map((item) => {
              const active = selectedOccasions.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleOccasion(item.id)}
                  className={`rounded-[1.4rem] border px-4 py-3 text-left text-sm font-semibold transition ${
                    active
                      ? 'border-[rgba(200,169,106,0.44)] bg-[rgba(200,169,106,0.10)] text-[#C9A24A]'
                      : 'border-[rgba(25,33,60,0.08)] bg-white text-[#19213C] hover:border-[rgba(200,169,106,0.3)]'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </section>
      </div>

      <div className="border-t border-[rgba(25,33,60,0.08)] bg-white/88 px-5 py-4 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-[#6B6F7A]">{resultLabel}</p>
          {activeCount > 0 ? (
            <button
              type="button"
              onClick={onClear}
              className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8D7667] transition hover:text-[#19213C]"
            >
              Reset
            </button>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClear}
          disabled={activeCount === 0}
          className="rounded-full border border-[rgba(25,33,60,0.1)] bg-white px-4 py-2 text-sm font-semibold text-[#19213C] transition hover:border-[rgba(200,169,106,0.38)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Clear all
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-full bg-[#19213C] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(25,33,60,0.18)] transition hover:bg-[#11172B]"
        >
          <FiSliders size={16} />
          View products
        </button>
        </div>
      </div>
    </div>
  )

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-[rgba(15,18,30,0.36)] backdrop-blur-[2px]"
          />

          <div className="hidden md:block">
            <motion.div
              initial={{ opacity: 0, x: 18, y: 8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 16, y: 8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-[calc(100%+1rem)] z-[75] w-[min(28rem,calc(100vw-2rem))]"
            >
              {content}
            </motion.div>
          </div>

          <div className="md:hidden">
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-0 bottom-0 z-[75] px-2 pb-2"
            >
              {content}
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

export default FilterSidebar
