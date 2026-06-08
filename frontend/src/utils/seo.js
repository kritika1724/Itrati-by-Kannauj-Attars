export const DEFAULT_SEO_TITLE = 'ITRATI by Kannauj Attars | Pure Attars, Perfumes, Rose Water & Essential Oils'
export const DEFAULT_SEO_DESCRIPTION =
  'Shop pure attars, perfumes, rose water, essential oils, and heritage fragrances handcrafted in Kannauj by ITRATI by Kannauj Attars.'

const ensureMetaTag = (name) => {
  if (typeof document === 'undefined') return null
  let tag = document.querySelector(`meta[name="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  return tag
}

export const applySeo = ({ title = DEFAULT_SEO_TITLE, description = DEFAULT_SEO_DESCRIPTION } = {}) => {
  if (typeof document === 'undefined') return

  document.title = title
  const descriptionTag = ensureMetaTag('description')
  if (descriptionTag) {
    descriptionTag.setAttribute('content', description)
  }
}

export const resetSeo = () => {
  applySeo()
}
