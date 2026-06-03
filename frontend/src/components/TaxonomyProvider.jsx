import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { BUYER_TYPES, PURPOSE_TAGS, FAMILY_TAGS, SEASON_TAGS, GENDER_TAGS } from '../config/taxonomy'

const TaxonomyContext = createContext({
  buyerTypes: BUYER_TYPES,
  purposes: PURPOSE_TAGS,
  families: FAMILY_TAGS,
  seasons: SEASON_TAGS,
  genders: GENDER_TAGS,
  collections: [],
  purposeMap: {},
  familyMap: {},
  seasonMap: {},
  genderMap: {},
  collectionMap: {},
  loading: true,
  error: '',
  refresh: async () => {},
})

const TAXONOMY_CACHE_KEY = 'ka:taxonomy:v2'

const readCachedTaxonomy = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.sessionStorage.getItem(TAXONOMY_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

const makeLookupMap = (items = []) =>
  items.reduce((acc, item) => {
    if (item?.id) acc[item.id] = item.label || item.id
    return acc
  }, {})

export function TaxonomyProvider({ children }) {
  const cachedTaxonomy = readCachedTaxonomy()
  const [purposes, setPurposes] = useState(cachedTaxonomy?.purposes?.length ? cachedTaxonomy.purposes : PURPOSE_TAGS)
  const [families, setFamilies] = useState(cachedTaxonomy?.families?.length ? cachedTaxonomy.families : FAMILY_TAGS)
  const [seasons, setSeasons] = useState(cachedTaxonomy?.seasons?.length ? cachedTaxonomy.seasons : SEASON_TAGS)
  const [genders, setGenders] = useState(cachedTaxonomy?.genders?.length ? cachedTaxonomy.genders : GENDER_TAGS)
  const [collections, setCollections] = useState(cachedTaxonomy?.collections?.length ? cachedTaxonomy.collections : [])
  const [loading, setLoading] = useState(!cachedTaxonomy)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      setError('')
      const data = await api.getTaxonomy()
      const nextPurposes = Array.isArray(data?.purposes) && data.purposes.length ? data.purposes : PURPOSE_TAGS
      const nextFamilies = Array.isArray(data?.families) && data.families.length ? data.families : FAMILY_TAGS
      const nextSeasons = Array.isArray(data?.seasons) && data.seasons.length ? data.seasons : SEASON_TAGS
      const nextGenders = Array.isArray(data?.genders) && data.genders.length ? data.genders : GENDER_TAGS
      const nextCollections = Array.isArray(data?.collections) ? data.collections : []
      setPurposes(nextPurposes)
      setFamilies(nextFamilies)
      setSeasons(nextSeasons)
      setGenders(nextGenders)
      setCollections(nextCollections)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          TAXONOMY_CACHE_KEY,
          JSON.stringify({
            purposes: nextPurposes,
            families: nextFamilies,
            seasons: nextSeasons,
            genders: nextGenders,
            collections: nextCollections,
          })
        )
      }
    } catch (err) {
      setError(err.message || 'Unable to load filters')
      setPurposes(PURPOSE_TAGS)
      setFamilies(FAMILY_TAGS)
      setSeasons(SEASON_TAGS)
      setGenders(GENDER_TAGS)
      setCollections([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const value = useMemo(
    () => ({
      buyerTypes: BUYER_TYPES,
      purposes,
      families,
      seasons,
      genders,
      collections,
      purposeMap: makeLookupMap(purposes),
      familyMap: makeLookupMap(families),
      seasonMap: makeLookupMap(seasons),
      genderMap: makeLookupMap(genders),
      collectionMap: makeLookupMap(collections),
      loading,
      error,
      refresh,
    }),
    [purposes, families, seasons, genders, collections, loading, error, refresh]
  )

  return <TaxonomyContext.Provider value={value}>{children}</TaxonomyContext.Provider>
}

export const useTaxonomy = () => useContext(TaxonomyContext)
