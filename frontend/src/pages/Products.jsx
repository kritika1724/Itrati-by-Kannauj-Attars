import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDispatch } from 'react-redux'
import { FiChevronDown, FiFilter, FiSearch } from 'react-icons/fi'
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
import {
  buildChoiceList,
  buildIdSet,
  CATEGORY_DEFAULTS,
  COLLECTION_MAP,
  countActiveFilters,
  DIRECTION_DEFAULTS,
  FAMILY_DEFAULTS,
  GENDER_DEFAULTS,
  OCCASION_DEFAULTS,
  readListParam,
  SEASON_DEFAULTS,
  SORT_MAP,
  SORT_OPTIONS,
  toUiSort,
} from '../utils/productFilters'

function Products() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchKey = searchParams.toString()
  const user = auth.getUser()
  const isAdmin = user?.isAdmin === true
  const filtersRef = useRef(null)
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
    loading: taxonomyLoading,
  } = useTaxonomy()

  const availableCollectionKeys = useMemo(
    () => new Set([...Object.keys(COLLECTION_MAP), ...taxonomyCollections.map((item) => item.id)]),
    [taxonomyCollections]
  )

  const collectionKey = (searchParams.get('collection') || '').trim().toLowerCase()
  const activeCollection = availableCollectionKeys.has(collectionKey) ? collectionKey : ''
  const collectionMeta = activeCollection
    ? COLLECTION_MAP[activeCollection] || {
        title: collectionMap[activeCollection] || activeCollection,
        lead: `${collectionMap[activeCollection] || activeCollection} curated by admin.`,
      }
    : null

  const [products, setProducts] = useState([])
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sort, setSort] = useState('popular')
  const [selectedOccasions, setSelectedOccasions] = useState([])
  const [selectedFamilies, setSelectedFamilies] = useState([])
  const [selectedSeasons, setSelectedSeasons] = useState([])
  const [selectedGenders, setSelectedGenders] = useState([])
  const [selectedDirections, setSelectedDirections] = useState([])
  const [bestSellerOnly, setBestSellerOnly] = useState(false)
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cartModal, setCartModal] = useState({ open: false, product: null })
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const [toast, setToast] = useState({ open: false, message: '' })

  const categories = useMemo(() => {
    const values = [...CATEGORY_DEFAULTS, ...products.map((item) => String(item?.category || '').trim())]
    return [...new Set(values.filter(Boolean))]
  }, [products])

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

  const activePurposeId = !activeCollection && selectedOccasions.length === 1 && selectedFamilies.length === 0 ? selectedOccasions[0] : ''
  const activePurposeMeta = activePurposeId
    ? getPurposeCollectionMeta(activePurposeId, purposeMap[activePurposeId] || activePurposeId)
    : null
  const pageMeta = collectionMeta || activePurposeMeta

  const suggestions = useMemo(() => getSearchSuggestions(products, keyword), [products, keyword])

  useEffect(() => {
    const qpKeyword = (searchParams.get('keyword') || '').trim()
    const qpSort = (searchParams.get('sort') || '').trim()
    const qpCategory = (searchParams.get('category') || '').trim()
    const qpMinPrice = (searchParams.get('minPrice') || '').trim()
    const qpMaxPrice = (searchParams.get('maxPrice') || '').trim()
    const qpBestSeller = (searchParams.get('bestSeller') || '').trim()
    const qpPageRaw = (searchParams.get('page') || '').trim()
    const nextPage = Number(qpPageRaw || 1)

    setKeyword(qpKeyword)
    setSort(toUiSort(qpSort))
    setSelectedCategory(qpCategory)
    setMinPrice(qpMinPrice)
    setMaxPrice(qpMaxPrice)
    setBestSellerOnly(['1', 'true', 'yes', 'on'].includes(qpBestSeller.toLowerCase()))
    setSelectedOccasions(readListParam(searchParams, 'purpose', purposeValues))
    setSelectedFamilies(readListParam(searchParams, 'family', familyValues))
    setSelectedSeasons(readListParam(searchParams, 'season', seasonValues))
    setSelectedGenders(readListParam(searchParams, 'gender', genderValues))
    setSelectedDirections(readListParam(searchParams, 'direction', directionValues))
    setPage(Number.isFinite(nextPage) && nextPage > 0 ? nextPage : 1)
  }, [searchKey, taxonomyLoading, purposeValues.size, familyValues.size, seasonValues.size, genderValues.size, directionValues.size])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await api.getProducts({
          page,
          limit: 12,
          keyword,
          sort: SORT_MAP[sort] || 'rating_desc',
          category: selectedCategory,
          purpose: selectedOccasions.join(','),
          family: selectedFamilies.join(','),
          season: selectedSeasons.join(','),
          gender: selectedGenders.join(','),
          direction: selectedDirections.join(','),
          bestSeller: bestSellerOnly ? 1 : '',
          minPrice,
          maxPrice,
          collection: activeCollection,
        })
        const list = Array.isArray(data) ? data : data.products || []
        setProducts(list)
        setPages(Array.isArray(data) ? 1 : data.pages || 1)
      } catch (err) {
        setError(err.message || 'Could not load products.')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [page, keyword, sort, selectedCategory, selectedOccasions, selectedFamilies, selectedSeasons, selectedGenders, selectedDirections, bestSellerOnly, minPrice, maxPrice, activeCollection])

  useEffect(() => {
    if (!filtersOpen) return undefined

    const handlePointerOutside = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setFiltersOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setFiltersOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('pointerdown', handlePointerOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [filtersOpen])

  useEffect(() => {
    if (!filtersOpen || !window.matchMedia('(max-width: 767px)').matches) {
      return undefined
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [filtersOpen])

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

  useEffect(() => {
    if (taxonomyLoading) return

    const nextParams = new URLSearchParams(searchParams)
    const setOrDelete = (key, value) => {
      if (value) {
        nextParams.set(key, value)
      } else {
        nextParams.delete(key)
      }
    }

    setOrDelete('keyword', keyword.trim())
    setOrDelete('sort', sort === 'popular' ? '' : SORT_MAP[sort] || '')
    setOrDelete('category', selectedCategory)
    setOrDelete('purpose', selectedOccasions.join(','))
    setOrDelete('family', selectedFamilies.join(','))
    setOrDelete('season', selectedSeasons.join(','))
    setOrDelete('gender', selectedGenders.join(','))
    setOrDelete('direction', selectedDirections.join(','))
    setOrDelete('minPrice', minPrice)
    setOrDelete('maxPrice', maxPrice)
    setOrDelete('bestSeller', bestSellerOnly ? '1' : '')
    setOrDelete('page', page > 1 ? String(page) : '')
    setOrDelete('collection', activeCollection)

    const nextString = nextParams.toString()
    if (nextString !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true })
    }
  }, [
    activeCollection,
    bestSellerOnly,
    keyword,
    maxPrice,
    minPrice,
    page,
    searchParams,
    selectedCategory,
    selectedDirections,
    selectedFamilies,
    selectedGenders,
    selectedOccasions,
    selectedSeasons,
    setSearchParams,
    sort,
    taxonomyLoading,
  ])

  const showToast = (message) => {
    window.clearTimeout(toastTimer.current)
    setToast({ open: true, message })
    toastTimer.current = window.setTimeout(() => setToast({ open: false, message: '' }), 2600)
  }

  const clearFilters = () => {
    const nextParams = new URLSearchParams(searchParams)
    ;['category', 'purpose', 'family', 'season', 'gender', 'direction', 'minPrice', 'maxPrice', 'bestSeller', 'page'].forEach((key) =>
      nextParams.delete(key)
    )
    setSearchParams(nextParams, { replace: true })
    setPage(1)
    setSelectedCategory('')
    setSelectedOccasions([])
    setSelectedFamilies([])
    setSelectedSeasons([])
    setSelectedGenders([])
    setSelectedDirections([])
    setBestSellerOnly(false)
    setMinPrice('')
    setMaxPrice('')
    setFiltersOpen(false)
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

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#FFFFFF_0%,#F7F2EA_52%,#FFFDF8_100%)] text-[#19213C]">
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
          <div className="sticky top-[calc(var(--ka-nav-height,80px)+0.35rem)] z-20 rounded-[1.5rem] border border-[rgba(25,33,60,0.08)] bg-[rgba(255,255,255,0.86)] p-2.5 shadow-[0_20px_52px_rgba(25,33,60,0.10)] backdrop-blur-xl sm:top-[calc(var(--ka-nav-height,80px)+0.75rem)] sm:rounded-[2rem] sm:p-4 sm:shadow-[0_24px_70px_rgba(25,33,60,0.10)]">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.92fr)]">
              <div ref={searchRef} className="relative">
                <div className="flex items-center gap-2.5 rounded-[1.2rem] border border-[rgba(25,33,60,0.08)] bg-white px-3.5 py-2.5 shadow-[0_8px_24px_rgba(25,33,60,0.04)] sm:gap-3 sm:rounded-[1.4rem] sm:px-4 sm:py-3">
                  <FiSearch className="text-[#8D7667]" size={17} />
                  <input
                    value={keyword}
                    onFocus={() => setSearchFocused(true)}
                    onChange={(event) => {
                      setPage(1)
                      setKeyword(event.target.value)
                    }}
                    placeholder="Search attars, perfumes, rose water..."
                    className="w-full bg-transparent text-[13px] text-[#19213C] outline-none placeholder:text-[#98A0B2] sm:text-sm"
                  />
                </div>

                {searchFocused && suggestions.length > 0 ? (
                  <div className="absolute inset-x-0 top-[calc(100%+0.75rem)] z-30 overflow-hidden rounded-[1.6rem] border border-[rgba(25,33,60,0.08)] bg-white shadow-[0_24px_70px_rgba(25,33,60,0.12)]">
                    {suggestions.map((item) => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => {
                          setSearchFocused(false)
                          navigate(`/products/${item._id}`)
                        }}
                        className="flex w-full items-center justify-between gap-4 border-b border-[rgba(25,33,60,0.06)] px-4 py-3 text-left last:border-b-0 hover:bg-[rgba(252,249,243,0.92)]"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#19213C]">{item.name}</p>
                          <p className="mt-1 text-xs text-[#6B6F7A]">{item.category || 'Attar'}</p>
                        </div>
                        <span className="text-xs font-semibold text-[#C9A24A]">View</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                <select
                  value={sort}
                  onChange={(event) => {
                    setPage(1)
                    setSort(event.target.value)
                  }}
                  className="rounded-[1.2rem] border border-[rgba(25,33,60,0.08)] bg-white px-3 py-2.5 text-[13px] font-semibold text-[#19213C] outline-none sm:rounded-[1.4rem] sm:px-4 sm:py-3 sm:text-sm"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <div ref={filtersRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setFiltersOpen((value) => !value)}
                    className="inline-flex w-full items-center justify-between gap-2 rounded-[1.2rem] border border-[rgba(25,33,60,0.08)] bg-white px-3 py-2.5 text-[13px] font-semibold text-[#19213C] shadow-[0_8px_24px_rgba(25,33,60,0.04)] sm:gap-3 sm:rounded-[1.4rem] sm:px-4 sm:py-3 sm:text-sm"
                  >
                    <span className="inline-flex items-center gap-2">
                      <FiFilter size={16} />
                      Filters
                    </span>
                    <span className="inline-flex items-center gap-2">
                      {activeFilterCount > 0 ? (
                        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[#19213C] px-2 py-0.5 text-[10px] font-semibold text-white">
                          {activeFilterCount}
                        </span>
                      ) : null}
                      <FiChevronDown className={`transition ${filtersOpen ? 'rotate-180' : ''}`} size={16} />
                    </span>
                  </button>

                  <FilterSidebar
                    open={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={(value) => {
                      setPage(1)
                      setSelectedCategory(value)
                    }}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    onMinPriceChange={(value) => {
                      setPage(1)
                      setMinPrice(value)
                    }}
                    onMaxPriceChange={(value) => {
                      setPage(1)
                      setMaxPrice(value)
                    }}
                    families={familyChoices}
                    selectedFamilies={selectedFamilies}
                    onToggleFamily={(id) => {
                      setPage(1)
                      setSelectedFamilies((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
                    }}
                    seasons={seasonChoices}
                    selectedSeasons={selectedSeasons}
                    onToggleSeason={(id) => {
                      setPage(1)
                      setSelectedSeasons((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
                    }}
                    genders={genderChoices}
                    selectedGenders={selectedGenders}
                    onToggleGender={(id) => {
                      setPage(1)
                      setSelectedGenders((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
                    }}
                    directions={directionChoices}
                    selectedDirections={selectedDirections}
                    onToggleDirection={(id) => {
                      setPage(1)
                      setSelectedDirections((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
                    }}
                    occasions={occasionChoices}
                    selectedOccasions={selectedOccasions}
                    onToggleOccasion={(id) => {
                      setPage(1)
                      setSelectedOccasions((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
                    }}
                    bestSellerOnly={bestSellerOnly}
                    onToggleBestSeller={() => {
                      setPage(1)
                      setBestSellerOnly((value) => !value)
                    }}
                    onClear={clearFilters}
                    activeCount={activeFilterCount}
                    resultLabel={loading ? 'Updating results…' : `${products.length} item${products.length === 1 ? '' : 's'} visible`}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:mt-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start xl:items-center">
              <div className="min-w-0">
                <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
                  {activeFilterCount > 0 ? (
                    <>
                      {selectedCategory ? <FilterChip>{selectedCategory}</FilterChip> : null}
                      {bestSellerOnly ? <FilterChip>Bestsellers</FilterChip> : null}
                      {selectedFamilies.map((id) => (
                        <FilterChip key={id}>{familyMap[id] || id}</FilterChip>
                      ))}
                      {selectedSeasons.map((id) => (
                        <FilterChip key={id}>{seasonMap[id] || id}</FilterChip>
                      ))}
                      {selectedGenders.map((id) => (
                        <FilterChip key={id}>{genderMap[id] || id}</FilterChip>
                      ))}
                      {selectedDirections.map((id) => (
                        <FilterChip key={id}>{directionMap[id] || id}</FilterChip>
                      ))}
                      {selectedOccasions.map((id) => (
                        <FilterChip key={id}>{purposeMap[id] || id}</FilterChip>
                      ))}
                      {minPrice ? <FilterChip>From ₹{minPrice}</FilterChip> : null}
                      {maxPrice ? <FilterChip>Up to ₹{maxPrice}</FilterChip> : null}
                    </>
                  ) : (
                    <p className="text-xs text-[#6B6F7A] sm:text-sm">Use filters to narrow by fragrance family, direction, category, season, gender, occasion, or price.</p>
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
                    Clear all filters
                  </button>
                ) : null}
                <p className="text-sm font-medium text-[#5F6475] lg:text-right">
                  {loading ? 'Curating products...' : `${products.length} items on this page`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[1480px]">
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
            onView={(product) => navigate(`/products/${product._id}`)}
            onAdd={handleAddFromCard}
            onQuickView={(product) => setQuickViewProduct(product)}
          />

          {!loading && products.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-[rgba(25,33,60,0.08)] bg-white/92 px-6 py-10 text-center shadow-[0_18px_50px_rgba(25,33,60,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#8D7667]">No matches</p>
              <h2 className="mt-3 text-2xl font-semibold text-[#19213C]">Nothing matched this filter combination.</h2>
              <p className="mt-3 text-sm leading-7 text-[#5F6475]">Try widening the price range, clearing a few filters, or exploring the complete collection.</p>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-full bg-[#19213C] px-5 py-3 text-sm font-semibold text-white"
              >
                Reset filters
              </button>
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
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
              onClick={() => setPage((value) => Math.min(pages, value + 1))}
              disabled={page >= pages}
              className="rounded-full border border-[rgba(25,33,60,0.12)] bg-white px-5 py-2.5 text-sm font-semibold text-[#19213C] transition hover:border-[rgba(200,169,106,0.34)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
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

function FilterChip({ children }) {
  return (
    <span className="rounded-full border border-[rgba(200,169,106,0.24)] bg-[rgba(255,251,243,0.92)] px-2.5 py-1 text-[11px] font-semibold text-[#C9A24A] sm:px-3 sm:py-1.5 sm:text-xs">
      {children}
    </span>
  )
}

export default Products
