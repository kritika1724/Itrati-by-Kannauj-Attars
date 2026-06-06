// Central list of "site-wide" editable images (non-product).
// Admin can upload/replace these from Admin -> Website Images.
import { PURPOSE_TAGS, FAMILY_TAGS } from './taxonomy'

export const SITE_ASSET_KEYS = [
  {
    key: 'site.logo',
    label: 'Brand: Logo icon',
    description: 'Round logo mark shown in the navbar and footer.',
  },
  {
    key: 'site.wordmark',
    label: 'Brand: Itrati wordmark image',
    description: 'The Itrati text image shown beside the logo in the navbar and footer.',
  },
  {
    key: 'site.favicon',
    label: 'Brand: Favicon',
    description: 'Small browser tab icon. Falls back to the logo icon when empty.',
  },
  { key: 'banner.popup.image', label: 'Banner: Popup Image' },
  { key: 'home.top.video', label: 'Home: Top Horizontal Video', type: 'video' },
  { key: 'home.hero.card', label: 'Home: Hero Card Image' },
  { key: 'home.hero.strip', label: 'Home: Hero Strip Image' },
  { key: 'home.story.distillation', label: 'Home: The Slow Craft Behind Every Drop Media' },
  { key: 'home.culture.glimpse', label: 'Home: Culture Section Image' },
  { key: 'home.house.photo', label: 'Home: Our House Photo' },
  { key: 'home.explore.signature', label: 'Home: Explore (Signature) Image' },
  { key: 'home.explore.heritage', label: 'Home: Explore (Heritage) Image' },
  { key: 'home.credibility.photo', label: 'Home: Business Details Below Media' },
  { key: 'about.ceo.photo', label: 'About: Founder/CEO Photo' },

  ...PURPOSE_TAGS.map((t) => ({
    key: `explore.purpose.${t.id}`,
    label: `Explore: Purpose (${t.label}) Image`,
  })),
  ...FAMILY_TAGS.map((t) => ({
    key: `explore.family.${t.id}`,
    label: `Explore: Family (${t.label}) Image`,
  })),

  { key: 'collections.signature.hero', label: 'Signature Collection: Hero Image' },
  { key: 'collections.heritage.hero', label: 'Heritage Collection: Hero Image' },

  { key: 'gallery.office.kannauj', label: 'Gallery: Kannauj Office Image' },
  { key: 'gallery.office.mumbai', label: 'Gallery: Mumbai Office Image' },

  { key: 'gallery.factory.main', label: 'Gallery: Factory Main Image' },
  { key: 'gallery.factory.distillation', label: 'Gallery: Distillation Image' },
  { key: 'gallery.factory.botanicals', label: 'Gallery: Botanicals Image' },
  { key: 'gallery.factory.packaging', label: 'Gallery: Bottling & Packaging Image' },
]
