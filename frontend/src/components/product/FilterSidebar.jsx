import { AnimatePresence, motion } from 'framer-motion'
import { FiCheck, FiSliders, FiX } from 'react-icons/fi'

function FilterSidebar({
  variant = 'drawer',
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
  sizeOptions = [],
  selectedSize = '',
  onSelectSize,
  availability = '',
  availabilityOptions = [],
  onSelectAvailability,
  bestSellerOnly = false,
  onToggleBestSeller,
  onClear,
  activeCount = 0,
  resultLabel = 'View products',
}) {
  const isInline = variant === 'inline'

  const content = (
    <div className={`flex w-full flex-col overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.995),rgba(252,249,243,0.985))] overscroll-contain ${
      isInline
        ? 'max-h-[calc(100svh-var(--ka-nav-height,80px)-2rem)] rounded-[18px] border border-[rgba(25,33,60,0.08)] shadow-[0_18px_50px_rgba(25,33,60,0.07)]'
        : 'h-[calc(100dvh-0.5rem)] max-h-[calc(100svh-0.5rem)] rounded-t-[1.65rem] shadow-[0_32px_90px_rgba(25,33,60,0.16)] md:h-auto md:max-h-[min(84vh,52rem)] md:rounded-[2rem] md:border md:border-[rgba(25,33,60,0.08)] xl:max-h-[min(80vh,46rem)]'
    }`}>
      <div className={`flex justify-center pt-3 md:hidden ${isInline ? 'hidden' : ''}`}>
        <span className="h-1.5 w-14 rounded-full bg-[rgba(25,33,60,0.12)]" />
      </div>

      <div className={`shrink-0 border-b border-[rgba(25,33,60,0.08)] px-4 pb-3 pt-3 sm:px-6 sm:py-5 ${isInline ? 'xl:px-5 xl:py-4' : ''}`}>
        <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8D7667] sm:text-xs sm:tracking-[0.32em]">Filter & refine</p>
          <h3 className="mt-1.5 text-lg font-semibold leading-tight text-[#19213C] sm:mt-2 sm:text-xl">Filters</h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
              activeCount > 0
                ? 'bg-[rgba(25,33,60,0.08)] text-[#19213C]'
                : 'bg-[rgba(25,33,60,0.05)] text-[#6B6F7A]'
            }`}>
              {activeCount > 0 ? `${activeCount} active` : 'No filters yet'}
            </span>
          </div>
        </div>
        {!isInline ? (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(25,33,60,0.10)] bg-white text-[#19213C] transition hover:border-[rgba(200,169,106,0.48)]"
            aria-label="Close filters"
          >
            <FiX size={18} />
          </button>
        ) : null}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto px-4 py-4 [-webkit-overflow-scrolling:touch] sm:px-6 sm:py-5 ${isInline ? 'lg:px-5 lg:py-4' : ''}`}>
        <div className={`grid gap-4 sm:gap-5 ${isInline ? 'grid-cols-1' : 'md:grid-cols-2 xl:grid-cols-1'}`}>
          <section className={isInline ? '' : 'md:col-span-2 xl:col-span-1'}>
            <SectionTitle eyebrow="Category" title="Product type" />
            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <PillChoice active={!selectedCategory} onClick={() => onSelectCategory?.('')}>
                All types
              </PillChoice>
              {categories.map((category) => (
                <PillChoice
                  key={category}
                  active={selectedCategory.toLowerCase() === category.toLowerCase()}
                  onClick={() => onSelectCategory?.(category)}
                >
                  {category}
                </PillChoice>
              ))}
            </div>
          </section>

          <section className={isInline ? '' : 'md:col-span-2 xl:col-span-1'}>
            <SectionTitle eyebrow="Price range" title="Set your budget" />
            <div className="mt-3 grid gap-3 min-[480px]:grid-cols-2">
              <PriceInput label="Min" value={minPrice} onChange={onMinPriceChange} placeholder="0" />
              <PriceInput label="Max" value={maxPrice} onChange={onMaxPriceChange} placeholder="5000" />
            </div>
          </section>

          <section>
            <SectionTitle eyebrow="Fragrance family" title="Choose the profile" />
            <OptionGrid
              items={families}
              selectedItems={selectedFamilies}
              onToggle={onToggleFamily}
            />
          </section>

          <section>
            <SectionTitle eyebrow="Size / ml" title="Bottle or pack size" />
            <div className="mt-3 grid gap-2 min-[480px]:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
              <OptionButton active={!selectedSize} onClick={() => onSelectSize?.('')}>
                All sizes
              </OptionButton>
              {sizeOptions.map((item) => (
                <OptionButton
                  key={item.id}
                  active={selectedSize.toLowerCase() === item.id.toLowerCase()}
                  onClick={() => onSelectSize?.(item.id)}
                >
                  {item.label}
                </OptionButton>
              ))}
            </div>
            {sizeOptions.length === 0 ? (
              <p className="mt-3 rounded-[1.2rem] bg-[rgba(25,33,60,0.05)] px-4 py-3 text-xs leading-5 text-[#6B6F7A]">
                Size choices are read from product pack labels once products load.
              </p>
            ) : null}
          </section>

          <section>
            <SectionTitle eyebrow="Availability" title="Stock status" />
            <div className="mt-3 grid gap-2 min-[480px]:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
              <OptionButton active={!availability} onClick={() => onSelectAvailability?.('')}>
                All stock
              </OptionButton>
              {availabilityOptions.map((item) => (
                <OptionButton
                  key={item.id}
                  active={availability === item.id}
                  onClick={() => onSelectAvailability?.(item.id)}
                >
                  {item.label}
                </OptionButton>
              ))}
            </div>
          </section>

          <section className={isInline ? '' : 'md:col-span-2 xl:col-span-1'}>
            <SectionTitle eyebrow="Popular picks" title="Bestseller edit" />
            <button
              type="button"
              onClick={onToggleBestSeller}
              className={`mt-3 flex w-full items-center justify-between gap-4 rounded-[1.4rem] border px-4 py-4 text-left transition ${
                bestSellerOnly
                  ? 'border-[rgba(200,169,106,0.4)] bg-[rgba(200,169,106,0.10)]'
                  : 'border-[rgba(25,33,60,0.08)] bg-white hover:border-[rgba(200,169,106,0.3)]'
              }`}
            >
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#19213C] sm:text-sm">Only bestselling products</p>
                <p className="mt-1 text-xs leading-5 text-[#6B6F7A]">See the most-loved attars, oils, and floral waters first.</p>
              </div>
              <SelectionDot active={bestSellerOnly} />
            </button>
          </section>

          <section>
            <SectionTitle eyebrow="Occasion" title="Purpose-led shopping" />
            <OptionGrid
              items={occasions}
              selectedItems={selectedOccasions}
              onToggle={onToggleOccasion}
            />
          </section>

          <section>
            <SectionTitle eyebrow="Fragrance direction" title="Scent character" />
            <OptionGrid
              items={directions}
              selectedItems={selectedDirections}
              onToggle={onToggleDirection}
            />
          </section>

          <section>
            <SectionTitle eyebrow="Season" title="Weather mood" />
            <OptionGrid
              items={seasons}
              selectedItems={selectedSeasons}
              onToggle={onToggleSeason}
            />
          </section>

          <section>
            <SectionTitle eyebrow="Gender" title="Audience" />
            <OptionGrid
              items={genders}
              selectedItems={selectedGenders}
              onToggle={onToggleGender}
            />
          </section>
        </div>
      </div>

      <div className={`shrink-0 border-t border-[rgba(25,33,60,0.08)] bg-white/92 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 sm:px-6 sm:pb-4 ${isInline ? 'lg:px-5' : ''}`}>
        <div className="mb-2.5 flex items-center justify-between gap-3">
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

        <div className="grid grid-cols-[0.9fr_1.1fr] gap-2.5 sm:flex sm:items-center sm:justify-between sm:gap-3">
          <button
            type="button"
            onClick={onClear}
            disabled={activeCount === 0}
            className={`w-full rounded-full border border-[rgba(25,33,60,0.1)] bg-white px-4 py-3 text-sm font-semibold text-[#19213C] transition hover:border-[rgba(200,169,106,0.38)] disabled:cursor-not-allowed disabled:opacity-45 sm:py-2.5 ${isInline ? '' : 'sm:w-auto'}`}
          >
            Clear all
          </button>
          {!isInline ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#19213C] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(25,33,60,0.18)] transition hover:bg-[#11172B] sm:w-auto sm:py-2.5"
            >
              <FiSliders size={16} />
              <span className="truncate">Apply</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )

  if (isInline) {
    return (
      <aside className="hidden lg:block">
        <div className="sticky top-[calc(var(--ka-nav-height,80px)+1rem)]">
          {content}
        </div>
      </aside>
    )
  }

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
            aria-label="Close filters"
          />

          <div className="hidden md:flex xl:hidden fixed inset-0 z-[75] items-center justify-center p-4 lg:p-6">
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.985 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="w-[min(48rem,calc(100vw-3rem))]"
            >
              {content}
            </motion.div>
          </div>

          <div className="hidden xl:block">
            <motion.div
              initial={{ opacity: 0, x: 18, y: 8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: 16, y: 8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-[calc(100%+1rem)] z-[75] w-[min(38rem,calc(100vw-3rem))]"
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
              className="fixed inset-x-0 bottom-0 z-[75] px-1.5 pb-0"
              role="dialog"
              aria-modal="true"
              aria-label="Product filters"
            >
              {content}
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  )
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">{eyebrow}</p>
      <h4 className="mt-1 text-sm font-semibold text-[#19213C]">{title}</h4>
    </div>
  )
}

function PriceInput({ label, value, onChange, placeholder }) {
  return (
    <label className="rounded-[1.4rem] border border-[rgba(25,33,60,0.08)] bg-white px-4 py-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D7667]">{label}</span>
      <input
        type="number"
        min="0"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full bg-transparent text-sm font-semibold text-[#19213C] outline-none placeholder:text-[#9AA0AE]"
      />
    </label>
  )
}

function PillChoice({ active = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-full border px-3 py-2 text-[13px] font-semibold transition sm:min-h-0 sm:px-4 sm:text-sm ${
        active
          ? 'border-[rgba(200,169,106,0.44)] bg-[rgba(200,169,106,0.12)] text-[#9D7A27]'
          : 'border-[rgba(25,33,60,0.08)] bg-white text-[#19213C] hover:border-[rgba(200,169,106,0.3)]'
      }`}
    >
      {children}
    </button>
  )
}

function OptionGrid({ items = [], selectedItems = [], onToggle }) {
  return (
    <div className="mt-3 grid gap-2 min-[480px]:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
      {items.map((item) => (
        <OptionButton
          key={item.id}
          active={selectedItems.includes(item.id)}
          onClick={() => onToggle?.(item.id)}
        >
          {item.label}
        </OptionButton>
      ))}
    </div>
  )
}

function OptionButton({ active = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 items-center justify-between gap-3 rounded-[1.4rem] border px-4 py-3 text-left text-[13px] font-semibold transition sm:text-sm ${
        active
          ? 'border-[rgba(200,169,106,0.44)] bg-[rgba(200,169,106,0.10)] text-[#9D7A27]'
          : 'border-[rgba(25,33,60,0.08)] bg-white text-[#19213C] hover:border-[rgba(200,169,106,0.3)]'
      }`}
    >
      <span className="min-w-0 truncate">{children}</span>
      <SelectionDot active={active} />
    </button>
  )
}

function SelectionDot({ active = false }) {
  return active ? (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#C9A24A] text-white">
      <FiCheck size={12} />
    </span>
  ) : (
    <span className="h-5 w-5 shrink-0 rounded-full border border-[rgba(25,33,60,0.16)] bg-white" />
  )
}

export default FilterSidebar
