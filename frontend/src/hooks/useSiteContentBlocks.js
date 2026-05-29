import { useMemo } from 'react'
import { useSiteContent } from '../components/SiteContentProvider'
import {
  LEGAL_PAGE_ROUTES,
  SITE_CONTENT_KEYS,
  mergeContactPageContent,
  mergeContactProfile,
  mergeLegalPageContent,
} from '../config/siteContent'

export const useSiteContactProfile = () => {
  const { contents } = useSiteContent()
  return useMemo(
    () => mergeContactProfile(contents[SITE_CONTENT_KEYS.contactProfile]),
    [contents]
  )
}

export const useContactPageContent = () => {
  const { contents } = useSiteContent()
  return useMemo(
    () => mergeContactPageContent(contents[SITE_CONTENT_KEYS.contactPage]),
    [contents]
  )
}

export const useLegalPageContent = (pathname) => {
  const { contents } = useSiteContent()
  return useMemo(() => {
    const config = LEGAL_PAGE_ROUTES[pathname] || LEGAL_PAGE_ROUTES['/terms-of-service']
    return {
      key: config.key,
      label: config.label,
      ...mergeLegalPageContent(config.key, contents[config.key]),
    }
  }, [contents, pathname])
}
