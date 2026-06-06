import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { FiCheck, FiChevronDown, FiFilter, FiX } from 'react-icons/fi'
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

const APPLIED_FILTER_KEYS = [
  'category',
  'productType',
  'type',
  'purpose',
  'occasion',
  'family',
  'fragranceFamily',
  'fragrance_family',
  'season',
  'gender',
  'direction',
  'fragranceDirection',
  'fragrance_direction',
  'minPrice',
  'maxPrice',
  'bestSeller',
  'page',
]

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

  const purposeValues = useMemo(() => buildIdSet(occasionChoices), [occasionChoices])
  const familyValues = useMemo(() => buildIdSet(familyChoices), [familyChoices])
  const seasonValues = useMemo(() => buildIdSet(seasonChoices), [seasonChoices])
  const genderValues = useMemo(() => buildIdSet(genderChoices), [genderChoices])
  const directionValues = useMemo(() => buildIdSet(directionChoices), [directionChoices])

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
    const nextBestSeller = ['1', 'true', 'yes', 'on'].includes(
      (searchParams.get('bestSeller') || '').trim().toLowerCase()
    )

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
        : {
            ...current,
            popular: true,
            category: false,
            price: false,
            family: false,
            direction: false,
            season: false,
            gender: false,
            occasion: false,
          }
    })
  }, [
    searchKey,
    taxonomyLoading,
    familyValues,
    directionValues,
    seasonValues,
    genderValues,
    purposeValues,
    searchParams,
  ])

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
      if (value) nextParams.set(key, value)
      else nextParams.delete(key)
    }

    APPLIED_FILTER_KEYS.forEach((key) => nextParams.delete(key))

    setOrDelete('category', selectedCategory)
    setOrDelete('purpose', selectedOccasions.join(','))
    setOrDelete('family', selectedFamilies.join(','))
    setOrDelete('season', selectedSeasons.join(','))
    setOrDelete('gender', selectedGenders.join(','))
    setOrDelete('direction', selectedDirections.join(','))
    setOrDelete('minPrice', minPrice)
    setOrDelete('maxPrice', maxPrice)
    setOrDelete('bestSeller', bestSellerOnly ? '1' : '')

    const nextQuery = nextParams.toString()
    navigate(`/products${nextQuery ? `?${nextQuery}` : ''}`)
  }

  return (
    <div className="min-h-[100dvh] w-full overflow-x-hidden bg-[linear-gradient(180deg,#FCFBF8_0%,#F5EEE3_100%)] text-[#19213C]">
      <header className="sticky top-0 z-40 border-b border-[rgba(25,33,60,0.08)] bg-[rgba(252,251,248,0.96)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl min-w-0 items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-[#19213C] sm:text-3xl">
              Product Filters
            </h1>
            <p className="mt-1 truncate text-xs font-medium text-[#6B6F7A]">
              {activeFilterCount > 0 ? `${activeFilterCount} selected` : 'All products'}
            </p>
          </div>

          <Link
            to={productsHref}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(25,33,60,0.1)] bg-white text-[#19213C] shadow-[0_12px_28px_rgba(25,33,60,0.08)]"
            aria-label="Close filters"
          >
            <FiX size={20} />
          </Link>
        </div>
      </header>

      <main className="px-3 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6">
        <div className="w-full max-w-5xl mx-auto space-y-3 sm:space-y-4">
          <section className="rounded-[1.4rem] border border-[rgba(25,33,60,0.08)] bg-white/95 p-4 shadow-[0_16px_45px_rgba(25,33,60,0.06)] sm:rounded-[1.8rem] sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8D7667] sm:text-xs">
                  Current selection
                </p>
                <p className="mt-2 text-sm text-[#5F6475]">
                  {activeFilterCount > 0
                    ? `${activeFilterCount} filters ready to apply`
                    : 'No filters selected yet. Open any heading below.'}
                </p>
              </div>

              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[rgba(25,33,60,0.06)] px-4 py-2 text-sm font-semibold text-[#19213C]">
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
              className={`flex w-full items-center justify-between gap-3 rounded-[1.15rem] border px-4 py-4 text-left transition ${
                bestSellerOnly
                  ? 'border-[rgba(200,169,106,0.42)] bg-[rgba(200,169,106,0.10)]'
                  : 'border-[rgba(25,33,60,0.08)] bg-white hover:border-[rgba(200,169,106,0.28)]'
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#19213C]">Only bestselling products</p>
                <p className="mt-1 text-xs leading-relaxed text-[#6B6F7A]">
                  Keep the top-performing fragrances at the front.
                </p>
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <PriceInput label="Min price" value={minPrice} onChange={setMinPrice} placeholder="0" />
              <PriceInput label="Max price" value={maxPrice} onChange={setMaxPrice} placeholder="5000" />
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
                setSelectedFamilies((prev) =>
                  prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                )
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
                setSelectedDirections((prev) =>
                  prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                )
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
                setSelectedSeasons((prev) =>
                  prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                )
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
                setSelectedGenders((prev) =>
                  prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                )
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
                setSelectedOccasions((prev) =>
                  prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
                )
              }
            />
          </FilterSection>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[rgba(25,33,60,0.08)] bg-[rgba(252,251,248,0.97)] px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl">
        <p className="mb-3 text-center text-xs text-[#5F6475]">
          {activeFilterCount > 0 ? `${activeFilterCount} filters selected` : 'Showing all products'}
        </p>

        <div className="grid w-full max-w-5xl grid-cols-2 gap-3 mx-auto">
          <button
            type="button"
            onClick={clearAll}
            disabled={activeFilterCount === 0}
            className="rounded-full border border-[rgba(25,33,60,0.12)] bg-white px-4 py-3 text-sm font-semibold text-[#19213C] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear all
          </button>

          <button
            type="button"
            onClick={applyFilters}
            className="rounded-full bg-[#19213C] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(25,33,60,0.18)]"
          >
            Apply filters
          </button>
        </div>
      </div>
    </div>
  )
}

function FilterSection({ title, summary, open, onToggle, children }) {
  return (
    <section className="overflow-hidden rounded-[1.4rem] border border-[rgba(25,33,60,0.08)] bg-white/95 shadow-[0_14px_40px_rgba(25,33,60,0.05)] sm:rounded-[1.8rem]">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center justify-between w-full gap-4 px-4 py-4 text-left sm:px-6 sm:py-5"
      >
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8D7667] sm:text-xs">
            {title}
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#5F6475]">{summary}</p>
        </div>

        <FiChevronDown
          className={`shrink-0 text-[#19213C] transition ${open ? 'rotate-180' : ''}`}
          size={18}
        />
      </button>

      {open ? (
        <div className="border-t border-[rgba(25,33,60,0.06)] px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      ) : null}
    </section>
  )
}

function OptionGrid({ items = [], selectedItems = [], onToggle }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {items.map((item) => {
        const active = selectedItems.includes(item.id)

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={`flex min-w-0 items-center justify-between gap-3 rounded-[1.15rem] border px-4 py-3 text-left transition ${
              active
                ? 'border-[rgba(200,169,106,0.42)] bg-[rgba(200,169,106,0.10)]'
                : 'border-[rgba(25,33,60,0.08)] bg-white hover:border-[rgba(200,169,106,0.28)]'
            }`}
          >
            <span className="min-w-0 truncate text-sm font-semibold text-[#19213C]">{item.label}</span>
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
      className={`max-w-full rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? 'border-[rgba(200,169,106,0.44)] bg-[rgba(200,169,106,0.12)] text-[#C9A24A]'
          : 'border-[rgba(25,33,60,0.08)] bg-white text-[#19213C] hover:border-[rgba(200,169,106,0.3)]'
      }`}
    >
      <span className="block max-w-[220px] truncate sm:max-w-none">{children}</span>
    </button>
  )
}

function PriceInput({ label, value, onChange, placeholder }) {
  return (
    <label className="block rounded-[1.15rem] border border-[rgba(25,33,60,0.08)] bg-white px-4 py-3">
      <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8D7667]">
        {label}
      </span>

      <input
        type="number"
        min="0"
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 block w-full min-w-0 bg-transparent text-base font-semibold text-[#19213C] outline-none placeholder:text-[#9AA0AE] sm:text-sm"
      />
    </label>
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
