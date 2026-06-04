import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'
import { toAssetUrl } from '../utils/media'

const SiteAssetsContext = createContext({
  assets: {},
  loading: false,
  refresh: async () => {},
  setAssetUrl: async () => {},
  deleteAssetKey: async () => {},
  uploadAndSetAsset: async () => {},
})

const ASSETS_CACHE_KEY = 'ka:site-assets:v2'

const readCachedAssets = () => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.sessionStorage.getItem(ASSETS_CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function SiteAssetsProvider({ children }) {
  const [assets, setAssets] = useState(() => readCachedAssets())
  const [loading, setLoading] = useState(() => Object.keys(readCachedAssets()).length === 0)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const list = await api.getAssets()
      const map = (list || []).reduce((acc, item) => {
        acc[item.key] = item.url
        return acc
      }, {})
      setAssets(map)
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(ASSETS_CACHE_KEY, JSON.stringify(map))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const favicon = document.getElementById('app-favicon')
    if (!favicon) return

    const faviconAsset = assets?.['site.favicon'] || assets?.['site.logo'] || ''
    const logoUrl = faviconAsset
      ? toAssetUrl(faviconAsset, import.meta.env.VITE_API_ASSET)
      : '/favicon.svg?v=ka-mark-circle'

    favicon.setAttribute('href', logoUrl)
  }, [assets])

  const setAssetUrl = useCallback(async (key, url) => {
    await api.setAsset(key, url)
    setAssets((prev) => {
      const next = { ...prev, [key]: url }
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(ASSETS_CACHE_KEY, JSON.stringify(next))
      }
      return next
    })
  }, [])

  const deleteAssetKey = useCallback(async (key) => {
    await api.deleteAsset(key)
    setAssets((prev) => {
      const next = { ...prev }
      delete next[key]
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(ASSETS_CACHE_KEY, JSON.stringify(next))
      }
      return next
    })
  }, [])

  const uploadAndSetAsset = useCallback(async (key, file) => {
    const uploaded = await api.uploadMedia(file)
    const url = uploaded.url || uploaded.absoluteUrl
    await setAssetUrl(key, url)
    return url
  }, [setAssetUrl])

  const value = useMemo(
    () => ({ assets, loading, refresh, setAssetUrl, deleteAssetKey, uploadAndSetAsset }),
    [assets, loading, refresh, setAssetUrl, deleteAssetKey, uploadAndSetAsset]
  )
  return <SiteAssetsContext.Provider value={value}>{children}</SiteAssetsContext.Provider>
}

export const useSiteAssets = () => useContext(SiteAssetsContext)
