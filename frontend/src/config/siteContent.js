import { BUSINESS } from './business'

export const SITE_CONTENT_KEYS = {
  contactProfile: 'contact.profile',
  contactPage: 'contact.page',
  popupBanner: 'banner.popup',
  homeYoutube: 'home.youtube',
  legalTerms: 'legal.terms',
  legalRefund: 'legal.refund',
  legalPrivacy: 'legal.privacy',
  legalShipping: 'legal.shipping',
}

const cloneValue = (value) => JSON.parse(JSON.stringify(value))
const trimString = (value) => String(value || '').trim()

export const DEFAULT_CONTACT_PROFILE = {
  emails: Array.isArray(BUSINESS.emails) && BUSINESS.emails.length ? BUSINESS.emails : [BUSINESS.email].filter(Boolean),
  phones: Array.isArray(BUSINESS.phones) ? BUSINESS.phones : [],
  offices: {
    kannauj: {
      label: BUSINESS.offices?.kannauj?.label || 'Kannauj Office',
      address: BUSINESS.offices?.kannauj?.address || '',
    },
    mumbai: {
      label: BUSINESS.offices?.mumbai?.label || 'Mumbai Office',
      address: BUSINESS.offices?.mumbai?.address || '',
    },
  },
}

export const DEFAULT_CONTACT_PAGE_CONTENT = {
  heroKicker: 'Get in touch',
  heroTitle: 'Talk to us about attars and aromatics.',
  heroDescription:
    'Reach out for wholesale inquiries, private labeling, custom blends, or gifting options tailored for special occasions.',
}

export const DEFAULT_POPUP_BANNER_CONTENT = {
  enabled: false,
  kicker: 'Popup banner',
  title: 'Discover our latest fragrance highlights',
  description:
    'Use this popup for launches, festive offers, gifting campaigns, or important website announcements.',
  ctaLabel: 'Explore products',
  ctaHref: '/products',
  dismissLabel: 'Maybe later',
  showOncePerSession: true,
}

export const DEFAULT_HOME_YOUTUBE_CONTENT = {
  enabled: true,
  youtubeUrl: 'https://www.youtube.com/watch?v=keUbMuQl8zI',
}

export const DEFAULT_LEGAL_CONTENT = {
  [SITE_CONTENT_KEYS.legalTerms]: {
    title: 'Terms of Service',
    intro:
      'These terms explain the basic conditions for browsing, ordering, and communicating with Itrati by Kannauj Attars.',
    sections: [
      {
        title: 'Orders and availability',
        body:
          'All orders are subject to product availability, confirmation, and review. Pack sizes, prices, and stock may change without prior notice until an order is confirmed.',
      },
      {
        title: 'Product presentation',
        body:
          'Natural fragrance materials can vary slightly in tone, color, or aroma from batch to batch. Product photos and descriptions are presented as close references, but minor artisanal variation is normal.',
      },
      {
        title: 'Use of the website',
        body:
          'You agree not to misuse the website, interfere with its operation, or submit inaccurate order or contact information. We may refuse or cancel requests that appear fraudulent or incomplete.',
      },
    ],
  },
  [SITE_CONTENT_KEYS.legalRefund]: {
    title: 'Refund Policy',
    intro:
      'This policy outlines when refund requests may be reviewed for fragrance, attar, floral water, and essential oil orders.',
    sections: [
      {
        title: 'Eligibility',
        body:
          'Refunds are generally considered for incorrect, damaged, or materially defective items reported promptly after delivery. Requests should include order details and supporting photos when relevant.',
      },
      {
        title: 'Non-returnable items',
        body:
          'Opened, used, or tampered fragrance products may not qualify for a refund unless the issue relates to transit damage or a verified fulfillment error.',
      },
      {
        title: 'Support process',
        body:
          `For assistance, please contact the team through the contact page or email ${BUSINESS.email} with your order information so the case can be reviewed.`,
      },
    ],
  },
  [SITE_CONTENT_KEYS.legalPrivacy]: {
    title: 'Privacy Policy',
    intro:
      'We collect only the basic information required to respond to enquiries, process orders, and support account or delivery communication.',
    sections: [
      {
        title: 'Information we use',
        body:
          'This may include your name, phone number, email address, shipping details, and order-related communication necessary to fulfill your request.',
      },
      {
        title: 'How it is used',
        body:
          'Your information is used for customer support, order updates, delivery coordination, and improving the storefront experience. We do not present this website as a marketplace for selling personal data.',
      },
      {
        title: 'Questions about privacy',
        body:
          `If you need clarification about how your information is handled, please reach out through the contact page or directly at ${BUSINESS.email}.`,
      },
    ],
  },
  [SITE_CONTENT_KEYS.legalShipping]: {
    title: 'Shipping Policy',
    intro:
      'This policy covers how shipping timelines, dispatch handling, and delivery communication are generally managed.',
    sections: [
      {
        title: 'Dispatch timing',
        body:
          'Dispatch timing can vary depending on stock, pack size, location, and order verification. Bulk or custom requirements may take additional processing time.',
      },
      {
        title: 'Delivery communication',
        body:
          'Customers may receive order and tracking updates through the contact details provided during checkout. Accurate phone and address information helps avoid delivery delays.',
      },
      {
        title: 'Shipping support',
        body:
          'If you need an update on a shipment, use the track order page or contact the team for direct assistance with your order reference.',
      },
    ],
  },
}

export const LEGAL_PAGE_ROUTES = {
  '/terms-of-service': { key: SITE_CONTENT_KEYS.legalTerms, label: 'Terms of Service' },
  '/refund-policy': { key: SITE_CONTENT_KEYS.legalRefund, label: 'Refund Policy' },
  '/privacy-policy': { key: SITE_CONTENT_KEYS.legalPrivacy, label: 'Privacy Policy' },
  '/shipping-policy': { key: SITE_CONTENT_KEYS.legalShipping, label: 'Shipping Policy' },
}

export const DEFAULT_SITE_CONTENT = {
  [SITE_CONTENT_KEYS.contactProfile]: DEFAULT_CONTACT_PROFILE,
  [SITE_CONTENT_KEYS.contactPage]: DEFAULT_CONTACT_PAGE_CONTENT,
  [SITE_CONTENT_KEYS.popupBanner]: DEFAULT_POPUP_BANNER_CONTENT,
  [SITE_CONTENT_KEYS.homeYoutube]: DEFAULT_HOME_YOUTUBE_CONTENT,
  ...DEFAULT_LEGAL_CONTENT,
}

export const getDefaultSiteContentValue = (key) => cloneValue(DEFAULT_SITE_CONTENT[key] || null)

const normalizeStringList = (value, fallback = []) => {
  const list = Array.isArray(value) ? value : []
  const normalized = list.map((item) => trimString(item)).filter(Boolean)
  return normalized.length ? normalized : fallback
}

const normalizeBoolean = (value, fallback = false) => {
  if (value === undefined || value === null) return fallback
  return value === true
}

const readOptionalString = (raw, key, fallback = '') => {
  if (!raw || typeof raw !== 'object' || !(key in raw)) return fallback
  return trimString(raw[key])
}

export const mergeContactProfile = (value) => {
  const fallback = getDefaultSiteContentValue(SITE_CONTENT_KEYS.contactProfile)
  const raw = value && typeof value === 'object' ? value : {}

  return {
    emails: normalizeStringList(raw.emails, fallback.emails),
    phones: normalizeStringList(raw.phones, fallback.phones),
    offices: {
      kannauj: {
        label: trimString(raw.offices?.kannauj?.label) || fallback.offices.kannauj.label,
        address: trimString(raw.offices?.kannauj?.address) || fallback.offices.kannauj.address,
      },
      mumbai: {
        label: trimString(raw.offices?.mumbai?.label) || fallback.offices.mumbai.label,
        address: trimString(raw.offices?.mumbai?.address) || fallback.offices.mumbai.address,
      },
    },
  }
}

export const mergeContactPageContent = (value) => {
  const fallback = getDefaultSiteContentValue(SITE_CONTENT_KEYS.contactPage)
  const raw = value && typeof value === 'object' ? value : {}

  return {
    heroKicker: trimString(raw.heroKicker) || fallback.heroKicker,
    heroTitle: trimString(raw.heroTitle) || fallback.heroTitle,
    heroDescription: trimString(raw.heroDescription) || fallback.heroDescription,
  }
}

export const mergePopupBannerContent = (value) => {
  const fallback = getDefaultSiteContentValue(SITE_CONTENT_KEYS.popupBanner)
  const raw = value && typeof value === 'object' ? value : {}

  return {
    enabled: normalizeBoolean(raw.enabled, fallback.enabled),
    kicker: readOptionalString(raw, 'kicker', fallback.kicker),
    title: readOptionalString(raw, 'title', fallback.title),
    description: readOptionalString(raw, 'description', fallback.description),
    ctaLabel: readOptionalString(raw, 'ctaLabel', fallback.ctaLabel),
    ctaHref: readOptionalString(raw, 'ctaHref', fallback.ctaHref),
    dismissLabel: readOptionalString(raw, 'dismissLabel', fallback.dismissLabel),
    showOncePerSession: normalizeBoolean(raw.showOncePerSession, fallback.showOncePerSession),
  }
}

export const mergeHomeYoutubeContent = (value) => {
  const fallback = getDefaultSiteContentValue(SITE_CONTENT_KEYS.homeYoutube)
  const raw = value && typeof value === 'object' ? value : {}

  return {
    enabled: normalizeBoolean(raw.enabled, fallback.enabled),
    youtubeUrl: readOptionalString(raw, 'youtubeUrl', fallback.youtubeUrl),
  }
}

export const mergeLegalPageContent = (key, value) => {
  const fallback = getDefaultSiteContentValue(key)
  const raw = value && typeof value === 'object' ? value : {}
  const sections = Array.isArray(raw.sections)
    ? raw.sections
        .map((section) => ({
          title: trimString(section?.title),
          body: trimString(section?.body),
        }))
        .filter((section) => section.title && section.body)
    : []

  return {
    title: trimString(raw.title) || fallback.title,
    intro: trimString(raw.intro) || fallback.intro,
    sections: sections.length ? sections : fallback.sections,
  }
}
