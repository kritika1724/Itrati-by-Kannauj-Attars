import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminAssetImage from '../components/AdminAssetImage'
import { useSiteContent } from '../components/SiteContentProvider'
import {
  LEGAL_PAGE_ROUTES,
  SITE_CONTENT_KEYS,
  getDefaultSiteContentValue,
  mergeContactPageContent,
  mergeContactProfile,
  mergeHomeYoutubeContent,
  mergePopupBannerContent,
  mergeLegalPageContent,
} from '../config/siteContent'

const LEGAL_EDITORS = Object.values(LEGAL_PAGE_ROUTES)

const splitList = (value) =>
  String(value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)

const createContactProfileDraft = (value) => {
  const profile = mergeContactProfile(value)
  return {
    emailsText: profile.emails.join('\n'),
    phonesText: profile.phones.join('\n'),
    kannaujLabel: profile.offices.kannauj.label,
    kannaujAddress: profile.offices.kannauj.address,
    mumbaiLabel: profile.offices.mumbai.label,
    mumbaiAddress: profile.offices.mumbai.address,
  }
}

const normalizeContactProfileDraft = (draft) =>
  mergeContactProfile({
    emails: splitList(draft.emailsText),
    phones: splitList(draft.phonesText),
    offices: {
      kannauj: {
        label: draft.kannaujLabel,
        address: draft.kannaujAddress,
      },
      mumbai: {
        label: draft.mumbaiLabel,
        address: draft.mumbaiAddress,
      },
    },
  })

const createContactPageDraft = (value) => mergeContactPageContent(value)
const createPopupBannerDraft = (value) => mergePopupBannerContent(value)
const createHomeYoutubeDraft = (value) => mergeHomeYoutubeContent(value)
const createLegalPagesDraft = (contents = {}) =>
  LEGAL_EDITORS.reduce((acc, item) => {
    acc[item.key] = mergeLegalPageContent(item.key, contents[item.key])
    return acc
  }, {})

function AdminSiteContent() {
  const { contents, loading, refresh, setContentValue, deleteContentKey } = useSiteContent()
  const [contactProfileDraft, setContactProfileDraft] = useState(() =>
    createContactProfileDraft(getDefaultSiteContentValue(SITE_CONTENT_KEYS.contactProfile))
  )
  const [contactPageDraft, setContactPageDraft] = useState(() =>
    createContactPageDraft(getDefaultSiteContentValue(SITE_CONTENT_KEYS.contactPage))
  )
  const [popupBannerDraft, setPopupBannerDraft] = useState(() =>
    createPopupBannerDraft(getDefaultSiteContentValue(SITE_CONTENT_KEYS.popupBanner))
  )
  const [homeYoutubeDraft, setHomeYoutubeDraft] = useState(() =>
    createHomeYoutubeDraft(getDefaultSiteContentValue(SITE_CONTENT_KEYS.homeYoutube))
  )
  const [legalPagesDraft, setLegalPagesDraft] = useState(() => createLegalPagesDraft())
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const legalPreviewLinks = useMemo(
    () =>
      Object.entries(LEGAL_PAGE_ROUTES).reduce((acc, [pathname, item]) => {
        acc[item.key] = pathname
        return acc
      }, {}),
    []
  )

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    setContactProfileDraft(createContactProfileDraft(contents[SITE_CONTENT_KEYS.contactProfile]))
    setContactPageDraft(createContactPageDraft(contents[SITE_CONTENT_KEYS.contactPage]))
    setPopupBannerDraft(createPopupBannerDraft(contents[SITE_CONTENT_KEYS.popupBanner]))
    setHomeYoutubeDraft(createHomeYoutubeDraft(contents[SITE_CONTENT_KEYS.homeYoutube]))
    setLegalPagesDraft(createLegalPagesDraft(contents))
  }, [contents])

  const addLegalSection = (key) => {
    setLegalPagesDraft((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        sections: [...(prev[key]?.sections || []), { title: '', body: '' }],
      },
    }))
  }

  const updateLegalSection = (key, index, field, value) => {
    setLegalPagesDraft((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        sections: (prev[key]?.sections || []).map((section, sectionIndex) =>
          sectionIndex === index ? { ...section, [field]: value } : section
        ),
      },
    }))
  }

  const removeLegalSection = (key, index) => {
    setLegalPagesDraft((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        sections: (prev[key]?.sections || []).filter((_, sectionIndex) => sectionIndex !== index),
      },
    }))
  }

  const resetKeyToDefault = async (key) => {
    setSaving(true)
    setMessage('')
    try {
      await deleteContentKey(key)
      setMessage('Section reset to default content.')
    } catch (error) {
      setMessage(error.message || 'Could not reset this section.')
    } finally {
      setSaving(false)
    }
  }

  const saveAll = async () => {
    setSaving(true)
    setMessage('')

    try {
      const contactProfilePayload = normalizeContactProfileDraft(contactProfileDraft)
      const contactPagePayload = mergeContactPageContent(contactPageDraft)
      const popupBannerPayload = mergePopupBannerContent(popupBannerDraft)
      const homeYoutubePayload = mergeHomeYoutubeContent(homeYoutubeDraft)
      const legalPayloads = LEGAL_EDITORS.map((item) => ({
        key: item.key,
        value: mergeLegalPageContent(item.key, legalPagesDraft[item.key]),
      }))

      await Promise.all([
        setContentValue(SITE_CONTENT_KEYS.contactProfile, contactProfilePayload),
        setContentValue(SITE_CONTENT_KEYS.contactPage, contactPagePayload),
        setContentValue(SITE_CONTENT_KEYS.popupBanner, popupBannerPayload),
        setContentValue(SITE_CONTENT_KEYS.homeYoutube, homeYoutubePayload),
        ...legalPayloads.map((item) => setContentValue(item.key, item.value)),
      ])

      setMessage('Website content updated.')
    } catch (error) {
      setMessage(error.message || 'Could not update website content.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-sand">
      <header className="px-6 pb-10 pt-12">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-xs uppercase tracking-[0.35em] text-muted">Admin</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl text-ink md:text-5xl">Website Content</h1>
              <p className="mt-3 max-w-3xl text-sm text-muted">
                Edit the important public website text from here, including contact details and legal pages.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-emberDark transition hover:border-gold/40"
              >
                Preview contact
              </Link>
              <button
                type="button"
                disabled={saving || loading}
                onClick={saveAll}
                className="rounded-full bg-ember px-6 py-3 text-sm font-semibold text-white transition hover:bg-emberDark disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save all changes'}
              </button>
            </div>
          </div>
          {message ? <p className="mt-4 text-sm font-semibold text-emberDark">{message}</p> : null}
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto grid w-full max-w-6xl gap-6">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-muted">Site-wide contact details</p>
                <h2 className="mt-2 text-xl font-semibold text-ink">Email, phone, and office information</h2>
                <p className="mt-2 text-sm text-muted">
                  These details can be reused across footer, contact, gallery, leadership, and other important areas.
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => resetKeyToDefault(SITE_CONTENT_KEYS.contactProfile)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark transition hover:border-gold/40 disabled:opacity-60"
              >
                Reset to default
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-ink">Emails</label>
                <textarea
                  rows="4"
                  value={contactProfileDraft.emailsText}
                  onChange={(e) => setContactProfileDraft((prev) => ({ ...prev, emailsText: e.target.value }))}
                  placeholder="kannaujattars@yahoo.com"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
                />
                <p className="mt-2 text-xs text-muted">One email per line, or use commas.</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">Phone numbers</label>
                <textarea
                  rows="4"
                  value={contactProfileDraft.phonesText}
                  onChange={(e) => setContactProfileDraft((prev) => ({ ...prev, phonesText: e.target.value }))}
                  placeholder="+91-9415124521"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/20"
                />
                <p className="mt-2 text-xs text-muted">One number per line, or use commas.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/80 bg-clay/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Kannauj office</p>
                <input
                  value={contactProfileDraft.kannaujLabel}
                  onChange={(e) => setContactProfileDraft((prev) => ({ ...prev, kannaujLabel: e.target.value }))}
                  placeholder="Kannauj Office"
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                />
                <textarea
                  rows="4"
                  value={contactProfileDraft.kannaujAddress}
                  onChange={(e) => setContactProfileDraft((prev) => ({ ...prev, kannaujAddress: e.target.value }))}
                  placeholder="Address"
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                />
              </div>
              <div className="rounded-2xl border border-slate-200/80 bg-clay/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">Mumbai office</p>
                <input
                  value={contactProfileDraft.mumbaiLabel}
                  onChange={(e) => setContactProfileDraft((prev) => ({ ...prev, mumbaiLabel: e.target.value }))}
                  placeholder="Mumbai Office"
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                />
                <textarea
                  rows="4"
                  value={contactProfileDraft.mumbaiAddress}
                  onChange={(e) => setContactProfileDraft((prev) => ({ ...prev, mumbaiAddress: e.target.value }))}
                  placeholder="Address"
                  className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-muted">Contact page</p>
                <h2 className="mt-2 text-xl font-semibold text-ink">Public page intro</h2>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => resetKeyToDefault(SITE_CONTENT_KEYS.contactPage)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark transition hover:border-gold/40 disabled:opacity-60"
              >
                Reset to default
              </button>
            </div>

            <div className="mt-6 grid gap-5">
              <div>
                <label className="text-sm font-semibold text-ink">Kicker</label>
                <input
                  value={contactPageDraft.heroKicker}
                  onChange={(e) => setContactPageDraft((prev) => ({ ...prev, heroKicker: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">Heading</label>
                <input
                  value={contactPageDraft.heroTitle}
                  onChange={(e) => setContactPageDraft((prev) => ({ ...prev, heroTitle: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">Description</label>
                <textarea
                  rows="4"
                  value={contactPageDraft.heroDescription}
                  onChange={(e) => setContactPageDraft((prev) => ({ ...prev, heroDescription: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-muted">Popup banner</p>
                <h2 className="mt-2 text-xl font-semibold text-ink">Public website popup card</h2>
                <p className="mt-2 max-w-3xl text-sm text-muted">
                  Use this for launches, festive offers, limited-time campaigns, or any message you want visitors to see in a small dismissible popup.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark transition hover:border-gold/40"
                >
                  Preview on site
                </Link>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => resetKeyToDefault(SITE_CONTENT_KEYS.popupBanner)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark transition hover:border-gold/40 disabled:opacity-60"
                >
                  Reset to default
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-5">
                <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-clay/40 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">Enable popup banner</p>
                    <p className="mt-1 text-xs text-muted">Show the popup on the public website. Admin and checkout pages stay unaffected.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={popupBannerDraft.enabled === true}
                    onChange={(e) =>
                      setPopupBannerDraft((prev) => ({ ...prev, enabled: e.target.checked }))
                    }
                    className="mt-1 h-5 w-5 accent-ember"
                  />
                </label>

                <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-clay/20 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">Show only once per session</p>
                    <p className="mt-1 text-xs text-muted">Recommended so visitors do not keep seeing the same popup repeatedly in one session.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={popupBannerDraft.showOncePerSession === true}
                    onChange={(e) =>
                      setPopupBannerDraft((prev) => ({ ...prev, showOncePerSession: e.target.checked }))
                    }
                    className="mt-1 h-5 w-5 accent-ember"
                  />
                </label>

                <div>
                  <label className="text-sm font-semibold text-ink">Kicker</label>
                  <input
                    value={popupBannerDraft.kicker}
                    onChange={(e) =>
                      setPopupBannerDraft((prev) => ({ ...prev, kicker: e.target.value }))
                    }
                    placeholder="Popup banner"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-ink">Heading</label>
                  <input
                    value={popupBannerDraft.title}
                    onChange={(e) =>
                      setPopupBannerDraft((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Discover our latest fragrance highlights"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-ink">Description</label>
                  <textarea
                    rows="4"
                    value={popupBannerDraft.description}
                    onChange={(e) =>
                      setPopupBannerDraft((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Describe the popup message."
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-ink">CTA label</label>
                    <input
                      value={popupBannerDraft.ctaLabel}
                      onChange={(e) =>
                        setPopupBannerDraft((prev) => ({ ...prev, ctaLabel: e.target.value }))
                      }
                      placeholder="Explore products"
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-ink">CTA link</label>
                    <input
                      value={popupBannerDraft.ctaHref}
                      onChange={(e) =>
                        setPopupBannerDraft((prev) => ({ ...prev, ctaHref: e.target.value }))
                      }
                      placeholder="/products or https://..."
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-ink">Dismiss button label</label>
                  <input
                    value={popupBannerDraft.dismissLabel}
                    onChange={(e) =>
                      setPopupBannerDraft((prev) => ({ ...prev, dismissLabel: e.target.value }))
                    }
                    placeholder="Maybe later"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-ink">Popup image</p>
                <p className="text-xs text-muted">Upload an optional image for the popup card.</p>
                <AdminAssetImage
                  assetKey="banner.popup.image"
                  className="w-full rounded-[1.6rem] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(243,235,223,0.72),rgba(255,255,255,0.96),rgba(17,27,58,0.06))]"
                  imgClassName="p-2"
                  defaultAspect="5 / 4"
                  fit="cover"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-muted">Home page YouTube</p>
                <h2 className="mt-2 text-xl font-semibold text-ink">Embed video at the end of home page</h2>
                <p className="mt-2 max-w-3xl text-sm text-muted">
                  Paste the YouTube link for the home-end video block. The knowledge buttons shown beside it are handled directly by the website layout.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark transition hover:border-gold/40"
                >
                  Preview on site
                </Link>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => resetKeyToDefault(SITE_CONTENT_KEYS.homeYoutube)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark transition hover:border-gold/40 disabled:opacity-60"
                >
                  Reset to default
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-5">
                <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-slate-200/80 bg-clay/40 px-5 py-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">Enable home-end video block</p>
                    <p className="mt-1 text-xs text-muted">Show the embedded YouTube block near the bottom of the home page.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={homeYoutubeDraft.enabled === true}
                    onChange={(e) =>
                      setHomeYoutubeDraft((prev) => ({ ...prev, enabled: e.target.checked }))
                    }
                    className="mt-1 h-5 w-5 accent-ember"
                  />
                </label>

                <div>
                  <label className="text-sm font-semibold text-ink">YouTube URL</label>
                  <input
                    value={homeYoutubeDraft.youtubeUrl}
                    onChange={(e) =>
                      setHomeYoutubeDraft((prev) => ({ ...prev, youtubeUrl: e.target.value }))
                    }
                    placeholder="https://www.youtube.com/embed/... or https://youtu.be/..."
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                  />
                  <p className="mt-2 text-xs text-muted">Use an embed URL for best results. Watch, short, nocookie, and embed links are normalized automatically.</p>
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-slate-200/80 bg-[linear-gradient(145deg,rgba(255,248,241,0.92),rgba(255,255,255,0.98),rgba(225,210,188,0.42))] p-5 shadow-[0_24px_80px_rgba(24,19,14,0.08)]">
                <p className="text-xs uppercase tracking-[0.35em] text-muted">Display note</p>
                <h3 className="mt-3 font-display text-2xl text-ink">Story block with knowledge pages</h3>
                <p className="mt-3 text-sm leading-7 text-muted">
                  This section appears at the very end of the home page with two built-in buttons: `Know about Kannauj` and `Know about Attars`.
                </p>
                <div className="mt-5 aspect-video rounded-[1.5rem] border border-white/70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.92),rgba(237,228,215,0.8),rgba(214,194,168,0.46))] shadow-inner" />
              </div>
            </div>
          </div>

          {LEGAL_EDITORS.map((item) => {
            const page = legalPagesDraft[item.key]
            return (
              <div key={item.key} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-muted">Legal page</p>
                    <h2 className="mt-2 text-xl font-semibold text-ink">{item.label}</h2>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to={legalPreviewLinks[item.key]}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark transition hover:border-gold/40"
                    >
                      Preview page
                    </Link>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => resetKeyToDefault(item.key)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark transition hover:border-gold/40 disabled:opacity-60"
                    >
                      Reset to default
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-5">
                  <div>
                    <label className="text-sm font-semibold text-ink">Page title</label>
                    <input
                      value={page?.title || ''}
                      onChange={(e) =>
                        setLegalPagesDraft((prev) => ({
                          ...prev,
                          [item.key]: { ...prev[item.key], title: e.target.value },
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-ink">Intro paragraph</label>
                    <textarea
                      rows="4"
                      value={page?.intro || ''}
                      onChange={(e) =>
                        setLegalPagesDraft((prev) => ({
                          ...prev,
                          [item.key]: { ...prev[item.key], intro: e.target.value },
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-200/80 bg-clay/30 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">Sections</p>
                      <p className="mt-1 text-xs text-muted">Add or edit the content cards shown on this page.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addLegalSection(item.key)}
                      className="rounded-full bg-ember px-4 py-2 text-xs font-semibold text-white transition hover:bg-emberDark"
                    >
                      + Add section
                    </button>
                  </div>

                  <div className="mt-4 grid gap-4">
                    {(page?.sections || []).map((section, index) => (
                      <div key={`${item.key}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                          <div>
                            <label className="text-xs font-semibold text-muted">Section title</label>
                            <input
                              value={section.title}
                              onChange={(e) => updateLegalSection(item.key, index, 'title', e.target.value)}
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeLegalSection(item.key, index)}
                              className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        <div className="mt-4">
                          <label className="text-xs font-semibold text-muted">Section body</label>
                          <textarea
                            rows="5"
                            value={section.body}
                            onChange={(e) => updateLegalSection(item.key, index, 'body', e.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default AdminSiteContent
