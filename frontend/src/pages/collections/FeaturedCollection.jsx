import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTaxonomy } from '../../components/TaxonomyProvider'
import CollectionCatalog from './CollectionCatalog'

const formatFallbackTitle = (value) =>
  String(value || '')
    .split(/[_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

function FeaturedCollection() {
  const { collectionSlug = '' } = useParams()
  const { collectionMap } = useTaxonomy()

  const title = collectionMap[collectionSlug] || formatFallbackTitle(collectionSlug) || 'Featured Collection'
  const lead = useMemo(
    () =>
      `${title} curated by admin. Browse all products currently placed inside this collection, and keep updating it anytime from admin access.`,
    [title]
  )

  return (
    <CollectionCatalog
      collectionKey={collectionSlug}
      title={title}
      lead={lead}
      heroAssetKey={`collections.dynamic.${collectionSlug}.hero`}
      membershipField="featuredCollections"
      queryParam="collection"
      heroFit="cover"
    />
  )
}

export default FeaturedCollection
