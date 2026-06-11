import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDispatch } from 'react-redux'
import { FiFilter, FiSearch, FiX } from 'react-icons/fi'
import AddToCartModal from '../components/AddToCartModal'
import RecentlyViewedStrip from '../components/RecentlyViewedStrip'
import { useTaxonomy } from '../components/TaxonomyProvider'
import FilterSidebar from '../components/product/FilterSidebar'
import ProductGrid from '../components/product/ProductGrid'
import ProductQuickViewModal from '../components/product/ProductQuickViewModal'
import ProductToast from '../components/product/ProductToast'
import { addToCart } from '../features/cartSlice'
import { getPurposeCollectionMeta } from '../config/collections'
import { fadeUp } from '../lib/motion'
import { api, auth } from '../services/api'
import { getSearchSuggestions } from '../components/product/productPresentation'
import { notifyCartItemAdded } from '../utils/cartLeadPrompt'
import { getProductPath } from '../utils/productLinks'
import {
  buildChoiceList,
  buildIdSet,
  buildSizeChoicesFromProducts,
  CATEGORY_DEFAULTS,
  COLLECTION_MAP,
  countActiveFilters,
  DIRECTION_DEFAULTS,
  FAMILY_DEFAULTS,
  GENDER_DEFAULTS,
  OCCASION_DEFAULTS,
  readFirstListParam,
  readListParam,
  SEASON_DEFAULTS,
  SORT_MAP,
  SORT_OPTIONS,
  toUiSort,
} from '../utils/productFilters'

const PAGE_SIZE = 12
const FILTER_PARAM_KEYS = [
  'keyword',
  'sort',
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
  'size',
  'ml',
  'pack',
  'packSize',
  'bestSeller',
  'page',
  'limit',
]

const normalizePage = (value) => {
  const page = Number(value || 1)
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
}

const normalizePriceDraft = (value) => {
  const trimmed = String(value || '').trim()
  if (!trimmed) return ''
  const price = Number(trimmed)
  return Number.isFinite(price) && price >= 0 ? String(Math.floor(price)) : ''
}

const getFirstParam = (searchParams, keys) => {
  for (const key of keys) {
    const value = (searchParams.get(key) || '').trim()
    if (value) return value
  }
  return ''
}

const canonicalCategory = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return CATEGORY_DEFAULTS.find((item) => item.toLowerCase() === raw.toLowerCase()) || raw
}

function Products() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchKey = searchParams.toString()
  const currentParams = useMemo(() => new URLSearchParams(searchKey), [searchKey])
  const user = auth.getUser()
  const isAdmin = user?.isAdmin === true
  const searchRef = useRef(null)
  const toastTimer = useRef(0)

  const {
    purposes: taxonomyPurposes,
    families: taxonomyFamilies,
    seasons: taxonomySeasons,
    genders: taxonomyGenders,
    directions: taxonomyDirections,
    collections: taxonomyCollections,
    purposeMap,
    familyMap,
    seasonMap,
    genderMap,
    directionMap,
    collectionMap,
  } = useTaxonomy()

  const availableCollectionKeys = useMemo(
    () => new Set([...Object.keys(COLLECTION_MAP), ...taxonomyCollections.map((item) => item.id)]),
    [taxonomyCollections]
  )

  const collectionKey = (currentParams.get('collection') || '').trim().toLowerCase()
  const activeCollection = availableCollectionKeys.has(collectionKey) ? collectionKey : ''
  const collectionMeta = activeCollection
    ? COLLECTION_MAP[activeCollection] || {
        title: collectionMap[activeCollection] || activeCollection,
        lead: `${collectionMap[activeCollection] || activeCollection} curated by admin.`,
      }
    : null

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

  const filters = useMemo(() => {
    const sortParam = (currentParams.get('sort') || '').trim()
    const bestSeller = (currentParams.get('bestSeller') || '').trim().toLowerCase()

    return {
      page: normalizePage(currentParams.get('page')),
      keyword: (currentParams.get('keyword') || '').trim(),
      sort: toUiSort(sortParam),
      selectedCategory: canonicalCategory(getFirstParam(currentParams, ['category', 'productType', 'type'])),
      selectedOccasions: readFirstListParam(currentParams, ['purpose', 'occasion'], purposeValues),
      selectedFamilies: readFirstListParam(currentParams, ['family', 'fragranceFamily', 'fragrance_family'], familyValues),
      selectedSeasons: readListParam(currentParams, 'season', seasonValues),
      selectedGenders: readListParam(currentParams, 'gender', genderValues),
      selectedDirections: readFirstListParam(currentParams, ['direction', 'fragranceDirection', 'fragrance_direction'], directionValues),
      selectedSize: getFirstParam(currentParams, ['size', 'ml', 'pack', 'packSize']),
      bestSellerOnly: ['1', 'true', 'yes', 'on'].includes(bestSeller),
      minPrice: normalizePriceDraft(currentParams.get('minPrice')),
      maxPrice: normalizePriceDraft(currentParams.get('maxPrice')),
    }
  }, [currentParams, directionValues, familyValues, genderValues, purposeValues, seasonValues])

  const {
    page,
    keyword,
    sort,
    selectedCategory,
    selectedOccasions,
    selectedFamilies,
    selectedSeasons,
    selectedGenders,
    selectedDirections,
    selectedSize,
    bestSellerOnly,
    minPrice,
    maxPrice,
  } = filters

  const [products, setProducts] = useState([])
  const [facetProducts, setFacetProducts] = useState([])
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [keywordDraft, setKeywordDraft] = useState(keyword)
  const [minPriceDraft, setMinPriceDraft] = useState(minPrice)
  const [maxPriceDraft, setMaxPriceDraft] = useState(maxPrice)
  const [searchFocused, setSearchFocused] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartModal, setCartModal] = useState({ open: false, product: null })
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const [toast, setToast] = useState({ open: false, message: '' })

  const facetSourceProducts = facetProducts.length > 0 ? facetProducts : products

  const categories = useMemo(() => {
    const values = [selectedCategory, ...CATEGORY_DEFAULTS, ...facetSourceProducts.map((item) => String(item?.category || '').trim())]
    return [...new Set(values.filter(Boolean))]
  }, [facetSourceProducts, selectedCategory])

  const sizeChoices = useMemo(
    () => buildSizeChoicesFromProducts(facetSourceProducts, selectedSize),
    [facetSourceProducts, selectedSize]
  )

  const activeFilterCount = countActiveFilters({
    keyword,
    selectedCategory,
    minPrice,
    maxPrice,
    selectedFamilies,
    selectedSeasons,
    selectedGenders,
    selectedDirections,
    selectedOccasions,
    selectedSize,
    bestSellerOnly,
  })

  const activePurposeId = !activeCollection && selectedOccasions.length === 1 && selectedFamilies.length === 0 ? selectedOccasions[0] : ''
  const activePurposeMeta = activePurposeId
    ? getPurposeCollectionMeta(activePurposeId, purposeMap[activePurposeId] || activePurposeId)
    : null
  const pageMeta = collectionMeta || activePurposeMeta
  const suggestions = useMemo(() => getSearchSuggestions(products, keywordDraft), [products, keywordDraft])
  const resultLabel = loading
    ? 'Updating products...'
    : total === 0
      ? 'No product available'
      : `${total} product${total === 1 ? '' : 's'} available`
  const filtersHref = `/products/filters${location.search || ''}`

  const updateParams = (updates, options = {}) => {
    const nextParams = new URLSearchParams(searchKey)
    const resetPage = options.resetPage !== false

    const setOrDelete = (key, value) => {
      const normalized = Array.isArray(value) ? value.filter(Boolean).join(',') : String(value ?? '').trim()
      if (key === 'sort' && (!normalized || normalized === 'latest')) {
        nextParams.delete(key)
        return
      }
      if (normalized) {
        nextParams.set(key, normalized)
      } else {
        nextParams.delete(key)
      }
    }

    Object.entries(updates).forEach(([key, value]) => setOrDelete(key, value))

    if (Object.prototype.hasOwnProperty.call(updates, 'category')) {
      nextParams.delete('productType')
      nextParams.delete('type')
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'family')) {
      nextParams.delete('fragranceFamily')
      nextParams.delete('fragrance_family')
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'direction')) {
      nextParams.delete('fragranceDirection')
      nextParams.delete('fragrance_direction')
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'size')) {
      nextParams.delete('ml')
      nextParams.delete('pack')
      nextParams.delete('packSize')
    }
    if (resetPage && !Object.prototype.hasOwnProperty.call(updates, 'page')) {
      nextParams.delete('page')
    }

    if (nextParams.toString() !== searchKey) {
      setSearchParams(nextParams, { replace: options.replace === true })
    }
  }

  const toggleListParam = (key, currentValues, id) => {
    const nextValues = currentValues.includes(id)
      ? currentValues.filter((item) => item !== id)
      : [...currentValues, id]
    updateParams({ [key]: nextValues.join(',') })
  }

  const clearFilters = () => {
    const nextParams = new URLSearchParams(searchKey)
    FILTER_PARAM_KEYS.forEach((key) => nextParams.delete(key))
    setSearchParams(nextParams, { replace: false })
    setSearchFocused(false)
  }

  useEffect(() => {
    setKeywordDraft(keyword)
    setMinPriceDraft(minPrice)
    setMaxPriceDraft(maxPrice)
  }, [keyword, minPrice, maxPrice])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextKeyword = keywordDraft.trim()
      const nextMinPrice = normalizePriceDraft(minPriceDraft)
      const nextMaxPrice = normalizePriceDraft(maxPriceDraft)
      if (nextKeyword === keyword && nextMinPrice === minPrice && nextMaxPrice === maxPrice) return

      const nextParams = new URLSearchParams(searchKey)
      const setOrDelete = (key, value) => {
        if (value) nextParams.set(key, value)
        else nextParams.delete(key)
      }

      setOrDelete('keyword', nextKeyword)
      setOrDelete('minPrice', nextMinPrice)
      setOrDelete('maxPrice', nextMaxPrice)
      nextParams.delete('page')

      if (nextParams.toString() !== searchKey) {
        setSearchParams(nextParams, { replace: true })
      }
    }, 320)

    return () => window.clearTimeout(timer)
  }, [keyword, keywordDraft, maxPrice, maxPriceDraft, minPrice, minPriceDraft, searchKey, setSearchParams])

  const productQuery = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      keyword,
      sort: SORT_MAP[sort] || 'latest',
      category: selectedCategory,
      purpose: selectedOccasions.join(','),
      family: selectedFamilies.join(','),
      season: selectedSeasons.join(','),
      gender: selectedGenders.join(','),
      direction: selectedDirections.join(','),
      bestSeller: bestSellerOnly ? 1 : '',
      minPrice,
      maxPrice,
      size: selectedSize,
      collection: activeCollection,
    }),
    [
      activeCollection,
      bestSellerOnly,
      keyword,
      maxPrice,
      minPrice,
      page,
      selectedCategory,
      selectedDirections,
      selectedFamilies,
      selectedGenders,
      selectedOccasions,
      selectedSeasons,
      selectedSize,
      sort,
    ]
  )

  useEffect(() => {
    let cancelled = false

    const loadFacetProducts = async () => {
      try {
        const data = await api.getProducts({ page: 1, limit: 100, sort: 'latest' })
        if (cancelled) return
        setFacetProducts(Array.isArray(data) ? data : data.products || [])
      } catch {
        if (!cancelled) setFacetProducts([])
      }
    }

    loadFacetProducts()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await api.getProducts(productQuery)
        if (cancelled) return

        const list = Array.isArray(data) ? data : data.products || []
        const nextPages = Array.isArray(data) ? 1 : data.pages || 1
        const nextTotal = Array.isArray(data) ? list.length : data.total || 0

        setProducts(list)
        setPages(nextPages)
        setTotal(nextTotal)

        if (nextTotal > 0 && page > nextPages) {
          const nextParams = new URLSearchParams(searchKey)
          nextParams.set('page', String(nextPages))
          setSearchParams(nextParams, { replace: true })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Could not load products.')
          setProducts([])
          setTotal(0)
          setPages(1)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [page, productQuery, searchKey, setSearchParams])

  useEffect(() => {
    const closeSuggestions = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', closeSuggestions)
    return () => document.removeEventListener('mousedown', closeSuggestions)
  }, [])

  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const showToast = (message) => {
    window.clearTimeout(toastTimer.current)
    setToast({ open: true, message })
    toastTimer.current = window.setTimeout(() => setToast({ open: false, message: '' }), 2600)
  }

  const handleCartConfirm = (selection) => {
    const product = cartModal.product
    if (!product) return
    const pack = Array.isArray(product.packs)
      ? product.packs.find((item) => (item.label || '').trim() === (selection.packLabel || '').trim())
      : null
    const regularPrice = Number(pack?.price || product.price)
    const salePrice = pack?.salePrice === null || pack?.salePrice === undefined || pack?.salePrice === '' ? null : Number(pack.salePrice)
    const effectivePrice = Number.isFinite(salePrice) && salePrice > 0 && salePrice < regularPrice ? salePrice : regularPrice

    dispatch(
      addToCart({
        product: product._id,
        name: product.name,
        price: effectivePrice,
        image: product.images?.[0] || '',
        packLabel: selection.packLabel || '',
        qty: selection.qty || 1,
        isSample: selection.isSample === true,
      })
    )
    notifyCartItemAdded({ productId: product._id, productName: product.name })

    setCartModal({ open: false, product: null })
    showToast(`${product.name} added to cart.`)
  }

  const handleAddFromCard = (product, payload = {}) => {
    if (payload.mode === 'sample') {
      const sample = product.sample || {}
      dispatch(
        addToCart({
          product: product._id,
          name: product.name,
          price: Number(sample.price),
          image: product.images?.[0] || '',
          packLabel: sample.label,
          isSample: true,
          qty: 1,
        })
      )
      notifyCartItemAdded({ productId: product._id, productName: product.name })
      showToast(`Sample for ${product.name} added to cart.`)
      return
    }

    setCartModal({ open: true, product })
  }

  const filterPanelProps = {
    categories,
    selectedCategory,
    onSelectCategory: (value) => updateParams({ category: value }),
    minPrice: minPriceDraft,
    maxPrice: maxPriceDraft,
    onMinPriceChange: setMinPriceDraft,
    onMaxPriceChange: setMaxPriceDraft,
    families: familyChoices,
    selectedFamilies,
    onToggleFamily: (id) => toggleListParam('family', selectedFamilies, id),
    seasons: seasonChoices,
    selectedSeasons,
    onToggleSeason: (id) => toggleListParam('season', selectedSeasons, id),
    genders: genderChoices,
    selectedGenders,
    onToggleGender: (id) => toggleListParam('gender', selectedGenders, id),
    directions: directionChoices,
    selectedDirections,
    onToggleDirection: (id) => toggleListParam('direction', selectedDirections, id),
    occasions: occasionChoices,
    selectedOccasions,
    onToggleOccasion: (id) => toggleListParam('purpose', selectedOccasions, id),
    sizeOptions: sizeChoices,
    selectedSize,
    onSelectSize: (value) => updateParams({ size: value }),
    bestSellerOnly,
    onToggleBestSeller: () => updateParams({ bestSeller: bestSellerOnly ? '' : '1' }),
    onClear: clearFilters,
    activeCount: activeFilterCount,
    resultLabel,
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F2EA_52%,#FFFDF8_100%)] text-[#19213C]">
      <section className="border-b border-[rgba(25,33,60,0.06)] px-4 pb-5 pt-5 sm:px-6 sm:pb-10 sm:pt-10 lg:px-8">
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="mx-auto w-full max-w-[1480px]">
          {pageMeta ? (
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.34em] text-[#8D7667]">Collection view</p>
              <h1 className="mt-3 font-display text-[2rem] leading-[1.02] tracking-[-0.05em] text-[#19213C] sm:mt-4 sm:text-5xl xl:text-6xl">
                {pageMeta.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5F6475] sm:mt-5 sm:text-lg sm:leading-8">{pageMeta.lead}</p>
            </div>
          ) : null}

          <div className={`${pageMeta ? 'mt-5 sm:mt-8' : ''} flex flex-wrap items-center gap-3`}>
            <Link
              to="/collections"
              className="rounded-full bg-[#19213C] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_14px_28px_rgba(25,33,60,0.15)] transition hover:bg-[#10162A] sm:px-5 sm:py-3 sm:text-sm sm:shadow-[0_18px_40px_rgba(25,33,60,0.18)]"
            >
              Shop by purpose
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1480px]">
          <div className="sticky top-[calc(var(--ka-nav-height,80px)+0.35rem)] z-20 rounded-[1.5rem] border border-[rgba(25,33,60,0.08)] bg-[rgba(255,255,255,0.88)] p-2.5 shadow-[0_20px_52px_rgba(25,33,60,0.10)] backdrop-blur-xl sm:top-[calc(var(--ka-nav-height,80px)+0.75rem)] sm:rounded-[2rem] sm:p-4 sm:shadow-[0_24px_70px_rgba(25,33,60,0.10)]">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.92fr)]">
              <div ref={searchRef} className="relative min-w-0">
                <div className="flex items-center gap-2.5 rounded-[1.2rem] border border-[rgba(25,33,60,0.08)] bg-white px-3.5 py-2.5 shadow-[0_8px_24px_rgba(25,33,60,0.04)] sm:gap-3 sm:rounded-[1.4rem] sm:px-4 sm:py-3">
                  <FiSearch className="shrink-0 text-[#8D7667]" size={17} />
                  <input
                    value={keywordDraft}
                    onFocus={() => setSearchFocused(true)}
                    onChange={(event) => setKeywordDraft(event.target.value)}
                    placeholder="Search attars, perfumes, rose water..."
                    className="min-w-0 w-full bg-transparent text-[13px] text-[#19213C] outline-none placeholder:text-[#98A0B2] sm:text-sm"
                  />
                  {keywordDraft ? (
                    <button
                      type="button"
                      onClick={() => setKeywordDraft('')}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[rgba(25,33,60,0.06)] text-[#19213C] transition hover:bg-[rgba(25,33,60,0.1)]"
                      aria-label="Clear search"
                    >
                      <FiX size={14} />
                    </button>
                  ) : null}
                </div>

                {searchFocused && suggestions.length > 0 ? (
                  <div className="absolute inset-x-0 top-[calc(100%+0.75rem)] z-30 overflow-hidden rounded-[1.6rem] border border-[rgba(25,33,60,0.08)] bg-white shadow-[0_24px_70px_rgba(25,33,60,0.12)]">
                    {suggestions.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => {
                          setSearchFocused(false)
                          navigate(getProductPath(item), { state: { productId: item?._id } })
                        }}
                        className="flex w-full items-center justify-between gap-4 border-b border-[rgba(25,33,60,0.06)] px-4 py-3 text-left last:border-b-0 hover:bg-[rgba(252,249,243,0.92)]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#19213C]">{item.name}</p>
                          <p className="mt-1 text-xs text-[#6B6F7A]">{item.category || 'Attar'}</p>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-[#C9A24A]">View</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-1">
                <select
                  value={sort}
                  onChange={(event) => updateParams({ sort: SORT_MAP[event.target.value] || 'latest' })}
                  className="min-w-0 rounded-[1.2rem] border border-[rgba(25,33,60,0.08)] bg-white px-3 py-2.5 text-[13px] font-semibold text-[#19213C] outline-none sm:rounded-[1.4rem] sm:px-4 sm:py-3 sm:text-sm"
                  aria-label="Sort products"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <Link
                  to={filtersHref}
                  className="inline-flex w-full min-w-0 items-center justify-between gap-2 rounded-[1.2rem] border border-[rgba(25,33,60,0.08)] bg-white px-3 py-2.5 text-[13px] font-semibold text-[#19213C] shadow-[0_8px_24px_rgba(25,33,60,0.04)] transition hover:border-[rgba(200,169,106,0.34)] sm:gap-3 sm:rounded-[1.4rem] sm:px-4 sm:py-3 sm:text-sm lg:hidden"
                  aria-label="Filters"
                >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <FiFilter className="shrink-0" size={16} />
                      <span className="truncate">Filters</span>
                    </span>
                    {activeFilterCount > 0 ? (
                      <span className="inline-flex shrink-0 items-center gap-2">
                        <span
                          className="inline-flex min-w-6 items-center justify-center rounded-full bg-[#19213C] px-2 py-0.5 text-[10px] font-semibold text-white"
                          aria-hidden="true"
                        >
                          {activeFilterCount}
                        </span>
                      </span>
                    ) : null}
                </Link>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:mt-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start xl:items-center">
              <div className="min-w-0">
                <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                  {activeFilterCount > 0 ? (
                    <>
                      {keyword ? <FilterChip onRemove={() => updateParams({ keyword: '' })}>Search: {keyword}</FilterChip> : null}
                      {selectedCategory ? <FilterChip onRemove={() => updateParams({ category: '' })}>Type: {selectedCategory}</FilterChip> : null}
                      {bestSellerOnly ? <FilterChip onRemove={() => updateParams({ bestSeller: '' })}>Bestsellers</FilterChip> : null}
                      {selectedFamilies.map((id) => (
                        <FilterChip key={id} onRemove={() => toggleListParam('family', selectedFamilies, id)}>
                          {familyMap[id] || id}
                        </FilterChip>
                      ))}
                      {selectedSeasons.map((id) => (
                        <FilterChip key={id} onRemove={() => toggleListParam('season', selectedSeasons, id)}>
                          {seasonMap[id] || id}
                        </FilterChip>
                      ))}
                      {selectedGenders.map((id) => (
                        <FilterChip key={id} onRemove={() => toggleListParam('gender', selectedGenders, id)}>
                          {genderMap[id] || id}
                        </FilterChip>
                      ))}
                      {selectedDirections.map((id) => (
                        <FilterChip key={id} onRemove={() => toggleListParam('direction', selectedDirections, id)}>
                          {directionMap[id] || id}
                        </FilterChip>
                      ))}
                      {selectedOccasions.map((id) => (
                        <FilterChip key={id} onRemove={() => toggleListParam('purpose', selectedOccasions, id)}>
                          {purposeMap[id] || id}
                        </FilterChip>
                      ))}
                      {selectedSize ? <FilterChip onRemove={() => updateParams({ size: '' })}>Size: {selectedSize}</FilterChip> : null}
                      {minPrice ? (
                        <FilterChip
                          onRemove={() => {
                            setMinPriceDraft('')
                            updateParams({ minPrice: '' }, { replace: true })
                          }}
                        >
                          From ₹{minPrice}
                        </FilterChip>
                      ) : null}
                      {maxPrice ? (
                        <FilterChip
                          onRemove={() => {
                            setMaxPriceDraft('')
                            updateParams({ maxPrice: '' }, { replace: true })
                          }}
                        >
                          Up to ₹{maxPrice}
                        </FilterChip>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-xs text-[#6B6F7A] sm:text-sm">Refine by product type, price, fragrance family, size, season, gender, or occasion.</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
                {activeFilterCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-full border border-[rgba(25,33,60,0.1)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#19213C] transition hover:border-[rgba(200,169,106,0.38)]"
                  >
                    Clear all
                  </button>
                ) : null}
                <p className="text-sm font-medium text-[#5F6475] lg:text-right">
                  {loading ? 'Curating products...' : `${products.length} shown of ${total}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-[1480px] gap-5 lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start">
          <FilterSidebar
            {...filterPanelProps}
            variant="inline"
            open
          />

          <div className="min-w-0">
            {error ? (
              <div className="mb-6 rounded-[1.6rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                <p className="font-semibold">Could not load products.</p>
                <p className="mt-1">{error}</p>
              </div>
            ) : null}

            <ProductGrid
              products={products}
              loading={loading}
              isAdmin={isAdmin}
              onView={(product) => navigate(getProductPath(product), { state: { productId: product?._id } })}
              onAdd={handleAddFromCard}
              onQuickView={(product) => setQuickViewProduct(product)}
            />

            {!loading && products.length === 0 ? (
              <div className="mt-6 rounded-[2rem] border border-[rgba(25,33,60,0.08)] bg-white/92 px-6 py-10 text-center shadow-[0_18px_50px_rgba(25,33,60,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">No product available</p>
                <h2 className="mt-3 text-2xl font-semibold text-[#19213C]">No product available for these filters.</h2>
                <p className="mt-3 text-sm leading-7 text-[#5F6475]">
                  Try removing one filter, widening the price range, or clearing all filters to see the full collection.
                </p>
                <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-full bg-[#19213C] px-5 py-3 text-sm font-semibold text-white"
                  >
                    Reset filters
                  </button>
                </div>
              </div>
            ) : null}

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => updateParams({ page: String(Math.max(1, page - 1)) }, { resetPage: false })}
                disabled={page <= 1}
                className="rounded-full border border-[rgba(25,33,60,0.12)] bg-white px-5 py-2.5 text-sm font-semibold text-[#19213C] transition hover:border-[rgba(200,169,106,0.34)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              <span className="rounded-full border border-[rgba(25,33,60,0.08)] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#6B6F7A]">
                Page {page} of {pages}
              </span>
              <button
                type="button"
                onClick={() => updateParams({ page: String(Math.min(pages, page + 1)) }, { resetPage: false })}
                disabled={page >= pages}
                className="rounded-full border border-[rgba(25,33,60,0.12)] bg-white px-5 py-2.5 text-sm font-semibold text-[#19213C] transition hover:border-[rgba(200,169,106,0.34)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-[rgba(25,33,60,0.06)] bg-[rgba(255,255,255,0.48)] pt-12">
        <RecentlyViewedStrip title="Recently viewed" />
      </div>

      <AddToCartModal
        open={cartModal.open}
        product={cartModal.product}
        onClose={() => setCartModal({ open: false, product: null })}
        onConfirm={handleCartConfirm}
      />

      <ProductQuickViewModal
        open={!!quickViewProduct}
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        familyMap={familyMap}
        onAddToCart={(product) => {
          setQuickViewProduct(null)
          setCartModal({ open: true, product })
        }}
        isAdmin={isAdmin}
      />

      <ProductToast open={toast.open} message={toast.message} />
    </div>
  )
}

function FilterChip({ children, onRemove }) {
  return (
    <span className="inline-flex max-w-[15rem] items-center gap-1.5 rounded-full border border-[rgba(200,169,106,0.24)] bg-[rgba(255,251,243,0.92)] px-2.5 py-1 text-[11px] font-semibold text-[#9D7A27] sm:px-3 sm:py-1.5 sm:text-xs">
      <span className="truncate">{children}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[rgba(25,33,60,0.08)] text-[#19213C] transition hover:bg-[rgba(25,33,60,0.14)]"
          aria-label="Remove filter"
        >
          <FiX size={11} />
        </button>
      ) : null}
    </span>
  )
}

export default Products
