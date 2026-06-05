import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FiCheck, FiChevronDown, FiChevronLeft, FiFilter } from 'react-icons/fi'
import { useTaxonomy } from '../components/TaxonomyProvider'
import {
  buildChoiceList,
  buildIdSet,
  CATEGORY_DEFAULTS,
  countActiveFilters,
  DIRECTION_DEFAULTS,
  FAMILY_DEFAULTS,
  GENDER_DEFAULTS,
  OCCASION_DEFAULTS,
  readListParam,
  SEASON_DEFAULTS,
} from '../utils/productFilters'

const createSectionState = ({
  bestSellerOnly = false,
  selectedCategory = '',
  minPrice = '',
  maxPrice = '',
  selectedFamilies = [],
  selectedDirections = [],
  selectedSeasons = [],
  selectedGenders = [],
  selectedOccasions = [],
} = {}) => ({
  popular: bestSellerOnly,
  category: Boolean(selectedCategory),
  price: Boolean(minPrice || maxPrice),
  family: selectedFamilies.length > 0,
  direction: selectedDirections.length > 0,
  season: selectedSeasons.length > 0,
  gender: selectedGenders.length > 0,
  occasion: selectedOccasions.length > 0,
})

function ProductFilters() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const searchKey = searchParams.toString()

  const {
    purposes: taxonomyPurposes,
    families: taxonomyFamilies,
    seasons: taxonomySeasons,
    genders: taxonomyGenders,
    directions: taxonomyDirections,
    purposeMap,
    familyMap,
    seasonMap,
    genderMap,
    directionMap,
    loading: taxonomyLoading,
  } = useTaxonomy()

  const familyChoices = useMemo(() => buildChoiceList(FAMILY_DEFAULTS, taxonomyFamilies), [taxonomyFamilies])
  const seasonChoices = useMemo(() => buildChoiceList(SEASON_DEFAULTS, taxonomySeasons), [taxonomySeasons])
  const genderChoices = useMemo(() => buildChoiceList(GENDER_DEFAULTS, taxonomyGenders), [taxonomyGenders])
  const directionChoices = useMemo(() => buildChoiceList(DIRECTION_DEFAULTS, taxonomyDirections), [taxonomyDirections])
  const occasionChoices = useMemo(() => buildChoiceList(OCCASION_DEFAULTS, taxonomyPurposes), [taxonomyPurposes])

  const purposeValues = buildIdSet(occasionChoices)
  const familyValues = buildIdSet(familyChoices)
  const seasonValues = buildIdSet(seasonChoices)
  const genderValues = buildIdSet(genderChoices)
  const directionValues = buildIdSet(directionChoices)

  const [selectedCategory, setSelectedCategory] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [selectedFamilies, setSelectedFamilies] = useState([])
  const [selectedDirections, setSelectedDirections] = useState([])
  const [selectedSeasons, setSelectedSeasons] = useState([])
  const [selectedGenders, setSelectedGenders] = useState([])
  const [selectedOccasions, setSelectedOccasions] = useState([])
  const [bestSellerOnly, setBestSellerOnly] = useState(false)
  const [openSections, setOpenSections] = useState({
    popular: true,
    category: false,
    price: false,
    family: false,
    direction: false,
    season: false,
    gender: false,
    occasion: false,
  })

  const categories = useMemo(
    () => [...new Set([...CATEGORY_DEFAULTS, String(selectedCategory || '').trim()].filter(Boolean))],
    [selectedCategory]
  )

  useEffect(() => {
    if (taxonomyLoading) return

    const nextCategory = (searchParams.get('category') || '').trim()
    const nextMinPrice = (searchParams.get('minPrice') || '').trim()
    const nextMaxPrice = (searchParams.get('maxPrice') || '').trim()
    const nextBestSeller = ['1', 'true', 'yes', 'on'].includes((searchParams.get('bestSeller') || '').trim().toLowerCase())
    const nextFamilies = readListParam(searchParams, 'family', familyValues)
    const nextDirections = readListParam(searchParams, 'direction', directionValues)
    const nextSeasons = readListParam(searchParams, 'season', seasonValues)
    const nextGenders = readListParam(searchParams, 'gender', genderValues)
    const nextOccasions = readListParam(searchParams, 'purpose', purposeValues)

    setSelectedCategory(nextCategory)
    setMinPrice(nextMinPrice)
    setMaxPrice(nextMaxPrice)
    setBestSellerOnly(nextBestSeller)
    setSelectedFamilies(nextFamilies)
    setSelectedDirections(nextDirections)
    setSelectedSeasons(nextSeasons)
    setSelectedGenders(nextGenders)
    setSelectedOccasions(nextOccasions)
    setOpenSections((current) => {
      const derived = createSectionState({
        bestSellerOnly: nextBestSeller,
        selectedCategory: nextCategory,
        minPrice: nextMinPrice,
        maxPrice: nextMaxPrice,
        selectedFamilies: nextFamilies,
        selectedDirections: nextDirections,
        selectedSeasons: nextSeasons,
        selectedGenders: nextGenders,
        selectedOccasions: nextOccasions,
      })

      return Object.values(derived).some(Boolean)
        ? derived
        : { ...current, popular: true, category: false, price: false, family: false, direction: false, season: false, gender: false, occasion: false }
    })
  }, [searchKey, taxonomyLoading, familyValues.size, directionValues.size, seasonValues.size, genderValues.size, purposeValues.size])

  const activeFilterCount = countActiveFilters({
    selectedCategory,
    minPrice,
    maxPrice,
    selectedFamilies,
    selectedSeasons,
    selectedGenders,
    selectedDirections,
    selectedOccasions,
    bestSellerOnly,
  })

  const productsHref = `/products${searchParams.toString() ? `?${searchParams.toString()}` : ''}`

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const clearAll = () => {
    setSelectedCategory('')
    setMinPrice('')
    setMaxPrice('')
    setSelectedFamilies([])
    setSelectedDirections([])
    setSelectedSeasons([])
    setSelectedGenders([])
    setSelectedOccasions([])
    setBestSellerOnly(false)
    setOpenSections({
      popular: true,
      category: false,
      price: false,
      family: false,
      direction: false,
      season: false,
      gender: false,
      occasion: false,
    })
  }

  const applyFilters = () => {
    const nextParams = new URLSearchParams(searchParams)
    const setOrDelete = (key, value) => {
      if (value) {
        nextParams.set(key, value)
      } else {
        nextParams.delete(key)
      }
    }

    setOrDelete('category', selectedCategory)
    setOrDelete('purpose', selectedOccasions.join(','))
    setOrDelete('family', selectedFamilies.join(','))
    setOrDelete('season', selectedSeasons.join(','))
    setOrDelete('gender', selectedGenders.join(','))
    setOrDelete('direction', selectedDirections.join(','))
    setOrDelete('minPrice', minPrice)
    setOrDelete('maxPrice', maxPrice)
    setOrDelete('bestSeller', bestSellerOnly ? '1' : '')
    nextParams.delete('page')

    const nextQuery = nextParams.toString()
    navigate(`/products${nextQuery ? `?${nextQuery}` : ''}`)
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FCFBF8_0%,#F5EEE3_100%)] text-[#19213C]">
      <header className="sticky top-0 z-20 border-b border-[rgba(25,33,60,0.08)] bg-[rgba(252,251,248,0.92)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to={productsHref}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(25,33,60,0.1)] bg-white text-[#19213C] shadow-[0_12px_30px_rgba(25,33,60,0.08)]"
            >
              <FiChevronLeft size={18} />
            </Link>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#8D7667]">Filter products</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#19213C] sm:text-3xl">Choose what to show</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={clearAll}
            disabled={activeFilterCount === 0}
            className="rounded-full border border-[rgba(25,33,60,0.1)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#19213C] transition hover:border-[rgba(200,169,106,0.38)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear all
          </button>
        </div>
      </header>

      <main className="px-4 pb-36 pt-6 sm:px-6">
        <div className="mx-auto w-full max-w-5xl space-y-4">
          <section className="rounded-[1.8rem] border border-[rgba(25,33,60,0.08)] bg-white/92 p-5 shadow-[0_20px_60px_rgba(25,33,60,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8D7667]">Current selection</p>
                <p className="mt-2 text-sm text-[#5F6475]">
                  {activeFilterCount > 0 ? `${activeFilterCount} filters ready to apply` : 'No filters selected yet. Open any heading below.'}
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(25,33,60,0.06)] px-4 py-2 text-sm font-semibold text-[#19213C]">
                <FiFilter size={16} />
                {activeFilterCount > 0 ? `${activeFilterCount} active` : 'All products'}
              </span>
            </div>
          </section>

          <FilterSection
            title="Popular picks"
            summary={bestSellerOnly ? 'Bestsellers only' : 'Show all products'}
            open={openSections.popular}
            onToggle={() => toggleSection('popular')}
          >
            <button
              type="button"
              onClick={() => setBestSellerOnly((value) => !value)}
              className={`flex w-full items-center justify-between rounded-[1.3rem] border px-4 py-4 text-left transition ${
                bestSellerOnly
                  ? 'border-[rgba(200,169,106,0.42)] bg-[rgba(200,169,106,0.10)]'
                  : 'border-[rgba(25,33,60,0.08)] bg-white hover:border-[rgba(200,169,106,0.28)]'
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-[#19213C]">Only bestselling products</p>
                <p className="mt-1 text-xs text-[#6B6F7A]">Keep the top-performing fragrances at the front.</p>
              </div>
              <SelectionDot active={bestSellerOnly} />
            </button>
          </FilterSection>

          <FilterSection
            title="Category"
            summary={selectedCategory || 'All categories'}
            open={openSections.category}
            onToggle={() => toggleSection('category')}
          >
            <div className="flex flex-wrap gap-2">
              <ChoiceChip active={!selectedCategory} onClick={() => setSelectedCategory('')}>
                All
              </ChoiceChip>
              {categories.map((category) => (
                <ChoiceChip
                  key={category}
                  active={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </ChoiceChip>
              ))}
            </div>
          </FilterSection>

          <FilterSection
            title="Price"
            summary={formatPriceSummary(minPrice, maxPrice)}
            open={openSections.price}
            onToggle={() => toggleSection('price')}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="rounded-[1.3rem] border border-[rgba(25,33,60,0.08)] bg-white px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D7667]">Min price</span>
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                  placeholder="0"
                  className="mt-2 w-full bg-transparent text-sm font-semibold text-[#19213C] outline-none placeholder:text-[#9AA0AE]"
                />
              </label>
              <label className="rounded-[1.3rem] border border-[rgba(25,33,60,0.08)] bg-white px-4 py-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8D7667]">Max price</span>
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                  placeholder="5000"
                  className="mt-2 w-full bg-transparent text-sm font-semibold text-[#19213C] outline-none placeholder:text-[#9AA0AE]"
                />
              </label>
            </div>
          </FilterSection>

          <FilterSection
            title="Fragrance family"
            summary={formatMultiSummary(selectedFamilies, familyMap)}
            open={openSections.family}
            onToggle={() => toggleSection('family')}
          >
            <OptionGrid
              items={familyChoices}
              selectedItems={selectedFamilies}
              onToggle={(id) =>
                setSelectedFamilies((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
              }
            />
          </FilterSection>

          <FilterSection
            title="Fragrance direction"
            summary={formatMultiSummary(selectedDirections, directionMap)}
            open={openSections.direction}
            onToggle={() => toggleSection('direction')}
          >
            <OptionGrid
              items={directionChoices}
              selectedItems={selectedDirections}
              onToggle={(id) =>
                setSelectedDirections((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
              }
            />
          </FilterSection>

          <FilterSection
            title="Season"
            summary={formatMultiSummary(selectedSeasons, seasonMap)}
            open={openSections.season}
            onToggle={() => toggleSection('season')}
          >
            <OptionGrid
              items={seasonChoices}
              selectedItems={selectedSeasons}
              onToggle={(id) =>
                setSelectedSeasons((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
              }
            />
          </FilterSection>

          <FilterSection
            title="Gender"
            summary={formatMultiSummary(selectedGenders, genderMap)}
            open={openSections.gender}
            onToggle={() => toggleSection('gender')}
          >
            <OptionGrid
              items={genderChoices}
              selectedItems={selectedGenders}
              onToggle={(id) =>
                setSelectedGenders((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
              }
            />
          </FilterSection>

          <FilterSection
            title="Occasion"
            summary={formatMultiSummary(selectedOccasions, purposeMap)}
            open={openSections.occasion}
            onToggle={() => toggleSection('occasion')}
          >
            <OptionGrid
              items={occasionChoices}
              selectedItems={selectedOccasions}
              onToggle={(id) =>
                setSelectedOccasions((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
              }
            />
          </FilterSection>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[rgba(25,33,60,0.08)] bg-[rgba(252,251,248,0.94)] px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <p className="text-sm text-[#5F6475]">
            {activeFilterCount > 0 ? `${activeFilterCount} filters selected` : 'Showing all products'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={clearAll}
              disabled={activeFilterCount === 0}
              className="rounded-full border border-[rgba(25,33,60,0.1)] bg-white px-4 py-2.5 text-sm font-semibold text-[#19213C] transition hover:border-[rgba(200,169,106,0.38)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="rounded-full bg-[#19213C] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(25,33,60,0.18)] transition hover:bg-[#10162A]"
            >
              Apply filters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilterSection({ title, summary, open, onToggle, children }) {
  return (
    <section className="overflow-hidden rounded-[1.8rem] border border-[rgba(25,33,60,0.08)] bg-white/92 shadow-[0_18px_50px_rgba(25,33,60,0.05)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8D7667]">{title}</p>
          <p className="mt-2 text-sm text-[#5F6475]">{summary}</p>
        </div>
        <FiChevronDown className={`shrink-0 text-[#19213C] transition ${open ? 'rotate-180' : ''}`} size={18} />
      </button>
      {open ? <div className="border-t border-[rgba(25,33,60,0.06)] px-5 py-5 sm:px-6">{children}</div> : null}
    </section>
  )
}

function OptionGrid({ items = [], selectedItems = [], onToggle }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((item) => {
        const active = selectedItems.includes(item.id)
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={`flex items-center justify-between rounded-[1.3rem] border px-4 py-3 text-left transition ${
              active
                ? 'border-[rgba(200,169,106,0.42)] bg-[rgba(200,169,106,0.10)]'
                : 'border-[rgba(25,33,60,0.08)] bg-white hover:border-[rgba(200,169,106,0.28)]'
            }`}
          >
            <span className="text-sm font-semibold text-[#19213C]">{item.label}</span>
            <SelectionDot active={active} />
          </button>
        )
      })}
    </div>
  )
}

function ChoiceChip({ active = false, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'border-[rgba(200,169,106,0.44)] bg-[rgba(200,169,106,0.12)] text-[#C9A24A]'
          : 'border-[rgba(25,33,60,0.08)] bg-white text-[#19213C] hover:border-[rgba(200,169,106,0.3)]'
      }`}
    >
      {children}
    </button>
  )
}

function SelectionDot({ active = false }) {
  return active ? (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#C9A24A] text-white">
      <FiCheck size={12} />
    </span>
  ) : (
    <span className="h-5 w-5 rounded-full border border-[rgba(25,33,60,0.16)] bg-white" />
  )
}

function formatMultiSummary(ids = [], labels = {}) {
  if (ids.length === 0) return 'No selections yet'
  if (ids.length === 1) return labels[ids[0]] || ids[0]
  return `${ids.length} selected`
}

function formatPriceSummary(minPrice = '', maxPrice = '') {
  if (minPrice && maxPrice) return `₹${minPrice} to ₹${maxPrice}`
  if (minPrice) return `From ₹${minPrice}`
  if (maxPrice) return `Up to ₹${maxPrice}`
  return 'Any price'
}

export default ProductFilters
