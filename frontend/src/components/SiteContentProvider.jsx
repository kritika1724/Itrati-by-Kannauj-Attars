import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../services/api'

const SiteContentContext = createContext({
  contents: {},
  loading: false,
  refresh: async () => {},
  setContentValue: async () => {},
  deleteContentKey: async () => {},
})

const SITE_CONTENT_CACHE_KEY = 'ka:site-content:v2'

const readCachedContent = () => {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.sessionStorage.getItem(SITE_CONTENT_CACHE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function SiteContentProvider({ children }) {
  const [contents, setContents] = useState(() => readCachedContent())
  const [loading, setLoading] = useState(() => Object.keys(readCachedContent()).length === 0)

  const persist = useCallback((next) => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SITE_CONTENT_CACHE_KEY, JSON.stringify(next))
    }
  }, [])

  const refresh = useCallback(async () => {
    const hasContent = Object.keys(readCachedContent()).length > 0
    if (!hasContent) setLoading(true)
    try {
      const list = await api.getSiteContent()
      const map = (list || []).reduce((acc, item) => {
        acc[item.key] = item.value
        return acc
      }, {})
      setContents(map)
      persist(map)
    } catch {
      // Keep cached copy visible while a slow refresh retries on next navigation/reload.
    } finally {
      setLoading(false)
    }
  }, [persist])

  useEffect(() => {
    refresh()
  }, [refresh])

  const setContentValue = useCallback(
    async (key, value) => {
      await api.setSiteContent(key, value)
      setContents((prev) => {
        const next = { ...prev, [key]: value }
        persist(next)
        return next
      })
    },
    [persist]
  )

  const deleteContentKey = useCallback(
    async (key) => {
      await api.deleteSiteContent(key)
      setContents((prev) => {
        const next = { ...prev }
        delete next[key]
        persist(next)
        return next
      })
    },
    [persist]
  )

  const value = useMemo(
    () => ({ contents, loading, refresh, setContentValue, deleteContentKey }),
    [contents, loading, refresh, setContentValue, deleteContentKey]
  )

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>
}

export const useSiteContent = () => useContext(SiteContentContext)
