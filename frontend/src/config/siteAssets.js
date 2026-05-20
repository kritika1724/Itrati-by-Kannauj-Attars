// Central list of "site-wide" editable images (non-product).
// Admin can upload/replace these from Admin -> Website Images.
import { PURPOSE_TAGS, FAMILY_TAGS } from './taxonomy'

export const SITE_ASSET_KEYS = [
  { key: 'site.logo', label: 'Site: Logo (Navbar / Branding)' },
  { key: 'home.top.video', label: 'Home: Top Horizontal Video', type: 'video' },
  { key: 'home.hero.card', label: 'Home: Hero Card Image' },
  { key: 'home.hero.strip', label: 'Home: Hero Strip Image' },
  { key: 'home.culture.glimpse', label: 'Home: Culture Section Image' },
  { key: 'home.house.photo', label: 'Home: Our House Photo' },
  { key: 'home.explore.signature', label: 'Home: Explore (Signature) Image' },
  { key: 'home.explore.heritage', label: 'Home: Explore (Heritage) Image' },
  { key: 'home.explore.custom', label: 'Home: Explore (Custom Blends) Image' },
  { key: 'home.credibility.photo', label: 'Home: Founder / Credibility Side Photo' },
  { key: 'about.ceo.photo', label: 'About: Founder/CEO Photo' },

  { key: 'explore.card.signature', label: 'Explore: Signature Card Image' },
  { key: 'explore.card.heritage', label: 'Explore: Heritage Card Image' },
  { key: 'explore.card.custom', label: 'Explore: Custom Blends Card Image' },
  { key: 'explore.card.blend', label: 'Explore: Create Blend Card Image' },
  { key: 'explore.card.quiz', label: 'Explore: Discovery Quiz Card Image' },
  { key: 'explore.card.knowledge', label: 'Explore: Knowledge Center Card Image' },
  { key: 'explore.card.gallery', label: 'Explore: Gallery Card Image' },
  { key: 'explore.card.all', label: 'Explore: All Products Card Image' },
  { key: 'explore.card.new', label: 'Explore: New Arrivals Card Image' },
  { key: 'explore.card.top', label: 'Explore: Top Rated Card Image' },
  { key: 'explore.card.gifting', label: 'Explore: Luxury Gifting Card Image' },
  { key: 'explore.card.wholesale', label: 'Explore: Wholesale / Bulk Card Image' },

  ...PURPOSE_TAGS.map((t) => ({
    key: `explore.purpose.${t.id}`,
    label: `Explore: Purpose (${t.label}) Image`,
  })),
  ...FAMILY_TAGS.map((t) => ({
    key: `explore.family.${t.id}`,
    label: `Explore: Family (${t.label}) Image`,
  })),

  { key: 'customblends.hero', label: 'Custom Blends: Hero Image' },
  { key: 'blend.hero', label: 'Create Blend: Hero Image' },
  { key: 'quiz.hero', label: 'Discovery Quiz: Hero Image' },
  { key: 'knowledge.hero', label: 'Knowledge Center: Hero Image' },
  { key: 'collections.signature.hero', label: 'Signature Collection: Hero Image' },
  { key: 'collections.heritage.hero', label: 'Heritage Collection: Hero Image' },

  { key: 'knowledge.card.attar-vs-perfume', label: 'Knowledge: Attar vs Perfume Card Image' },
  { key: 'knowledge.card.essential-oils-extraction', label: 'Knowledge: Essential Oils Extraction Card Image' },
  { key: 'knowledge.card.aroma-chemicals', label: 'Knowledge: Aroma Chemicals Card Image' },
  { key: 'knowledge.card.natural-vs-synthetic', label: 'Knowledge: Natural vs Synthetic Card Image' },
  { key: 'knowledge.card.store-your-oils', label: 'Knowledge: Storage Card Image' },
  { key: 'knowledge.card.ifra-safety', label: 'Knowledge: IFRA & Safety Card Image' },

  { key: 'gallery.office.kannauj', label: 'Gallery: Kannauj Office Image' },
  { key: 'gallery.office.mumbai', label: 'Gallery: Mumbai Office Image' },

  { key: 'gallery.factory.main', label: 'Gallery: Factory Main Image' },
  { key: 'gallery.factory.distillation', label: 'Gallery: Distillation Image' },
  { key: 'gallery.factory.botanicals', label: 'Gallery: Botanicals Image' },
  { key: 'gallery.factory.packaging', label: 'Gallery: Bottling & Packaging Image' },
]
