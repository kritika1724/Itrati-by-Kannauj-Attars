import { BUSINESS } from '../config/business'

export const slugifyProductPart = (value) =>
  String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const getProductSlug = (product) => {
  const existingSlug = String(product?.slug || '').trim()
  if (existingSlug) return existingSlug

  const productSlug = slugifyProductPart(product?.name)
  const brandSlug = slugifyProductPart(BUSINESS.fullDisplayName)
  return [productSlug, brandSlug].filter(Boolean).join('-')
}

export const getProductPath = (product) => {
  const slug = getProductSlug(product)
  const fallbackId = String(product?._id || product?.product || '').trim()
  return `/products/${slug || fallbackId}`
}
