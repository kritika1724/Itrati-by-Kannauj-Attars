const PRODUCT_BRAND_SLUG_TEXT = 'Itrati by Kannauj Attars'

const slugifyProductPart = (value) =>
  String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const buildProductSlug = (product) => {
  const nameSlug = slugifyProductPart(product?.name)
  const brandSlug = slugifyProductPart(PRODUCT_BRAND_SLUG_TEXT)
  return [nameSlug, brandSlug].filter(Boolean).join('-')
}

const withProductSlug = (product) => {
  if (!product) return product
  const relatedProducts = Array.isArray(product.relatedProducts)
    ? product.relatedProducts.map((item) => (item && typeof item === 'object' ? withProductSlug(item) : item))
    : product.relatedProducts

  return {
    ...product,
    relatedProducts,
    slug: buildProductSlug(product),
  }
}

module.exports = { buildProductSlug, slugifyProductPart, withProductSlug }
