import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import AdminAssetImage from '../components/AdminAssetImage'
import { BUSINESS } from '../config/business'
import { useSiteAssets } from '../components/SiteAssetsProvider'
import { useSiteContactProfile } from '../hooks/useSiteContentBlocks'
import { api, auth } from '../services/api'
import { toAssetUrl } from '../utils/media'

const fade = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
}

const sortKeysByNumericTail = (prefix, keys) => {
  const withIndex = keys
    .map((key) => {
      const tail = key.slice(prefix.length)
      const n = Number.parseInt(tail, 10)
      return { key, n: Number.isFinite(n) ? n : 0 }
    })
    .sort((a, b) => a.n - b.n)
  return withIndex.map((x) => x.key)
}

function ExtraPhotosGrid({ title, prefix, description = '' }) {
  const { assets, uploadAndSetAsset, deleteAssetKey } = useSiteAssets()
  const [user, setUser] = useState(auth.getUser())
  const isAdmin = user?.isAdmin === true
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const onAuth = () => setUser(auth.getUser())
    window.addEventListener('authchange', onAuth)
    return () => window.removeEventListener('authchange', onAuth)
  }, [])

  const keys = useMemo(() => {
    const all = Object.keys(assets || {})
    const matched = all.filter((k) => k.startsWith(prefix))
    return sortKeysByNumericTail(prefix, matched)
  }, [assets, prefix])

  const onAdd = async (file) => {
    setBusy(true)
    setMessage('')
    try {
      // Timestamp tail keeps keys unique and sortable.
      const key = `${prefix}${Date.now()}`
      await uploadAndSetAsset(key, file)
      setMessage('Photo added.')
    } catch (e) {
      setMessage(e.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const onRemove = async (key) => {
    if (!window.confirm('Remove this photo?')) return
    setBusy(true)
    setMessage('')
    try {
      await deleteAssetKey(key)
      setMessage('Photo removed.')
    } catch (e) {
      setMessage(e.message || 'Remove failed')
    } finally {
      setBusy(false)
    }
  }

  if (!isAdmin && keys.length === 0) return null

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted">More photos</p>
          <h3 className="mt-3 text-lg font-semibold text-ink">{title}</h3>
          {description ? <p className="mt-2 text-sm text-muted">{description}</p> : null}
        </div>
        {isAdmin ? (
          <label className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white transition rounded-full cursor-pointer bg-ember hover:bg-emberDark">
            <FiPlus />
            Add photo
            <input
              type="file"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onAdd(file)
              }}
              className="sr-only"
            />
          </label>
        ) : null}
      </div>

      {message ? <p className="mt-4 text-sm font-semibold text-emberDark">{message}</p> : null}

      <div className="grid gap-6 mt-6 md:grid-cols-3">
        {keys.map((key) => (
          <div key={key} className="relative p-4 bg-white border shadow-sm rounded-3xl border-slate-200/80">
            <AdminAssetImage
              assetKey={key}
              className="ka-frame ka-mediaBg aspect-[4/3] w-full"
              imgClassName="p-2"
              defaultAspect="4 / 3"
              fit="contain"
            />
            {isAdmin ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => onRemove(key)}
                className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-full hover:bg-red-50 disabled:opacity-60"
                title="Remove photo"
              >
                <FiTrash2 />
                Remove
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function Gallery() {
  const [user, setUser] = useState(auth.getUser())
  const contactProfile = useSiteContactProfile()
  const isAdmin = user?.isAdmin === true

  const [dynamicSections, setDynamicSections] = useState([])
  const [dynLoading, setDynLoading] = useState(false)
  const [dynError, setDynError] = useState('')
  const [dynMessage, setDynMessage] = useState('')

  const [newOpen, setNewOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [dynBusy, setDynBusy] = useState(false)

  useEffect(() => {
    const onAuth = () => setUser(auth.getUser())
    window.addEventListener('authchange', onAuth)
    return () => window.removeEventListener('authchange', onAuth)
  }, [])

  const loadDynamic = async () => {
    setDynLoading(true)
    setDynError('')
    try {
      const data = await api.getGallery()
      setDynamicSections(Array.isArray(data?.sections) ? data.sections : [])
    } catch (e) {
      setDynError(e.message || 'Request failed')
    } finally {
      setDynLoading(false)
    }
  }

  useEffect(() => {
    loadDynamic()
  }, [])

  const createTopic = async () => {
    const title = String(newTitle || '').trim()
    if (!title) {
      setDynError('Please enter a topic title.')
      return
    }
    setDynBusy(true)
    setDynError('')
    setDynMessage('')
    try {
      await api.createGallerySection({ title, description: String(newDesc || '').trim() })
      setNewOpen(false)
      setNewTitle('')
      setNewDesc('')
      setDynMessage('Topic created.')
      await loadDynamic()
    } catch (e) {
      setDynError(e.message || 'Request failed')
    } finally {
      setDynBusy(false)
    }
  }

  const addPhotoToTopic = async (sectionId, file) => {
    if (!file) return
    setDynBusy(true)
    setDynError('')
    setDynMessage('')
    try {
      const uploaded = await api.uploadImage(file)
      const url = uploaded.url || uploaded.absoluteUrl
      await api.addGalleryPhoto(sectionId, { url })
      setDynMessage('Photo added.')
      await loadDynamic()
    } catch (e) {
      setDynError(e.message || 'Upload failed')
    } finally {
      setDynBusy(false)
    }
  }

  const removePhoto = async (photoId) => {
    if (!window.confirm('Remove this photo?')) return
    setDynBusy(true)
    setDynError('')
    setDynMessage('')
    try {
      await api.deleteGalleryPhoto(photoId)
      setDynMessage('Photo removed.')
      await loadDynamic()
    } catch (e) {
      setDynError(e.message || 'Remove failed')
    } finally {
      setDynBusy(false)
    }
  }

  const removeTopic = async (sectionId) => {
    if (!window.confirm('Delete this topic and all its photos?')) return
    setDynBusy(true)
    setDynError('')
    setDynMessage('')
    try {
      await api.deleteGallerySection(sectionId)
      setDynMessage('Topic removed.')
      await loadDynamic()
    } catch (e) {
      setDynError(e.message || 'Remove failed')
    } finally {
      setDynBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-sand">
      <header className="px-6 pt-12 pb-12">
        <div className="w-full max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            animate="show"
            variants={fade}
            transition={{ duration: 0.55 }}
            className="max-w-3xl"
          >
            <p className="ka-kicker">Gallery</p>
            <h1 className="mt-4 ka-h1">
              Spaces, heritage, and craft — {BUSINESS.displayName}
            </h1>
            {/* <p className="mt-4 ka-lead">
              Add your own photos anytime. If you are logged in as admin, you will see an upload
              button directly on each image block.
            </p> */}
          </motion.div>
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="w-full max-w-6xl mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              {/* <p className="ka-kicker">Section</p> */}
              <h2 className="mt-3 ka-h2">Offices</h2>
              <p className="mt-3 text-sm text-muted">
                Two locations — one rooted in Kannauj, one for Mumbai trade and distribution.
              </p>
            </div>
            <Link
              to="/contact"
              className="px-5 py-2 ka-btn-primary"
            >
              Contact us
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <article className="p-6 ka-card">
              <AdminAssetImage
                assetKey="gallery.office.kannauj"
                className="ka-frame aspect-[16/10] w-full bg-[linear-gradient(135deg,rgba(17,27,58,0.14),rgba(255,255,255,0.92),rgba(201,162,74,0.22))]"
                imgClassName="p-2"
                defaultAspect="16 / 10"
              />
              <h3 className="mt-4 text-lg font-semibold text-ink">{contactProfile.offices.kannauj.label}</h3>
              <p className="mt-2 text-sm text-muted">{contactProfile.offices.kannauj.address}</p>
            </article>

            <article className="p-6 ka-card">
              <AdminAssetImage
                assetKey="gallery.office.mumbai"
                className="ka-frame aspect-[16/10] w-full bg-[linear-gradient(135deg,rgba(201,162,74,0.20),rgba(255,255,255,0.94),rgba(17,27,58,0.12))]"
                imgClassName="p-2"
                defaultAspect="16 / 10"
              />
              <h3 className="mt-4 text-lg font-semibold text-ink">{contactProfile.offices.mumbai.label}</h3>
              <p className="mt-2 text-sm text-muted">{contactProfile.offices.mumbai.address}</p>
            </article>
          </div>

          <ExtraPhotosGrid
            title="Office photos"
            prefix="gallery.office.extra."
            description="Add more office photos (signboard, interiors, reception, storage, dispatch)."
          />
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="w-full max-w-6xl mx-auto">
          <div className="max-w-3xl mb-8">
            <p className="ka-kicker">Section</p>
            <h2 className="mt-3 ka-h2">Factory & Craft</h2>
            <p className="mt-3 text-sm text-muted">
              This is where the authentic Kannauj process comes alive — distillation, blending, and bottling.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="p-6 ka-card">
              <AdminAssetImage
                assetKey="gallery.factory.main"
                className="ka-frame aspect-[16/9] w-full bg-[radial-gradient(circle_at_top,rgba(201,162,74,0.26),rgba(255,255,255,0.94))]"
                imgClassName="p-2"
                defaultAspect="16 / 9"
              />
              <h3 className="mt-4 text-lg font-semibold text-ink">Factory / Workshop</h3>
              <p className="mt-2 text-sm text-muted">
                Add photos of the deg & bhapka setup, botanical ingredients, blending tools, and packing line.
              </p>
            </div>
          </div>

          <ExtraPhotosGrid
            title="Factory / workshop photos"
            prefix="gallery.factory.extra."
            description="Add extra factory photos (workshop, tools, blending, resting, quality checks, dispatch)."
          />

          <div className="grid gap-6 mt-6 md:grid-cols-3">
            {[
              {
                key: 'gallery.factory.distillation',
                title: 'Distillation',
                copy: 'Deg & bhapka stills, steam line, condenser, safe handling.',
                bg: 'bg-[linear-gradient(135deg,rgba(17,27,58,0.14),rgba(255,255,255,0.92),rgba(201,162,74,0.20))]',
              },
              {
                key: 'gallery.factory.botanicals',
                title: 'Botanicals',
                copy: 'Rose, kewra, sandalwood notes, seasonal herbs and spices.',
                bg: 'bg-[linear-gradient(135deg,rgba(201,162,74,0.22),rgba(255,255,255,0.94),rgba(17,27,58,0.10))]',
              },
              {
                key: 'gallery.factory.packaging',
                title: 'Bottling & Packaging',
                copy: 'Bottle shots, label close-ups, gift packing, dispatch bundles.',
                bg: 'bg-[linear-gradient(135deg,rgba(17,27,58,0.10),rgba(255,255,255,0.92),rgba(201,162,74,0.24))]',
              },
            ].map((card) => (
              <article
                key={card.key}
                className="p-6 ka-card"
              >
                <AdminAssetImage
                  assetKey={card.key}
                  className={`ka-frame aspect-[4/3] w-full ${card.bg}`}
                  imgClassName="p-2"
                  defaultAspect="4 / 3"
                />
                <h3 className="mt-4 text-lg font-semibold text-ink">{card.title}</h3>
                <p className="mt-2 text-sm text-muted">{card.copy}</p>
              </article>
            ))}
          </div>

          <ExtraPhotosGrid
            title="Distillation photos"
            prefix="gallery.factory.distillation.extra."
            description="Add more photos of deg & bhapka stills, steam line, condenser, and safe handling."
          />
          <ExtraPhotosGrid
            title="Botanicals photos"
            prefix="gallery.factory.botanicals.extra."
            description="Add more photos of rose, kewra, botanicals, and seasonal ingredients."
          />
          <ExtraPhotosGrid
            title="Bottling & packaging photos"
            prefix="gallery.factory.packaging.extra."
            description="Add more photos of bottles, labels, packing, and dispatch bundles."
          />
        </div>
      </section>

      {isAdmin || dynamicSections.length > 0 ? (
        <section className="px-6 pb-20">
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <p className="ka-kicker">Section</p>
                <h2 className="mt-3 ka-h2">More topics</h2>
                <p className="mt-3 text-sm text-muted">
                  Create any new topic and add photos inside it — for example: Dispatch, Quality checks, Awards, Storage,
                  Lab, Team, Events.
                </p>
              </div>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => setNewOpen((v) => !v)}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white transition rounded-full bg-ember hover:bg-emberDark"
                >
                  <FiPlus />
                  Add new topic
                </button>
              ) : null}
            </div>

            {newOpen && isAdmin ? (
              <div className="p-6 mb-10 bg-white border shadow-sm rounded-3xl border-slate-200/80">
                <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.32em] text-muted">Topic title</label>
                    <input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g., Dispatch & Packaging"
                      className="w-full px-4 py-3 mt-2 text-sm font-semibold bg-white border rounded-2xl border-slate-200 text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-[0.32em] text-muted">
                      Short description (optional)
                    </label>
                    <input
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="1 line about what photos belong here"
                      className="w-full px-4 py-3 mt-2 text-sm bg-white border rounded-2xl border-slate-200 text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={dynBusy}
                      onClick={createTopic}
                      className="px-5 py-3 text-sm font-semibold text-white transition rounded-full bg-ember hover:bg-emberDark disabled:opacity-60"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      disabled={dynBusy}
                      onClick={() => setNewOpen(false)}
                      className="px-5 py-3 text-sm font-semibold transition bg-white border rounded-full border-slate-200 text-emberDark hover:border-gold/40 hover:bg-clay/60 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {dynError ? <p className="mb-6 text-sm font-semibold text-red-600">{dynError}</p> : null}
            {dynMessage ? <p className="mb-6 text-sm font-semibold text-emberDark">{dynMessage}</p> : null}
            {dynLoading ? <p className="mb-6 text-sm text-muted">Loading topics…</p> : null}

            <div className="grid gap-8">
              {dynamicSections.map((section) => (
                <div
                  key={section._id}
                  className="p-6 bg-white border shadow-lg rounded-3xl border-slate-200/80 shadow-black/10"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-ink">{section.title}</h3>
                      {section.description ? (
                        <p className="mt-2 text-sm text-muted">{section.description}</p>
                      ) : null}
                    </div>

                    {isAdmin ? (
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white transition rounded-full cursor-pointer bg-ember hover:bg-emberDark">
                          <FiPlus />
                          Add photo
                          <input
                            type="file"
                            disabled={dynBusy}
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) addPhotoToTopic(section._id, file)
                              // allow re-uploading the same file immediately
                              e.currentTarget.value = ''
                            }}
                            className="sr-only"
                          />
                        </label>
                        <button
                          type="button"
                          disabled={dynBusy}
                          onClick={() => removeTopic(section._id)}
                          className="px-5 py-2 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-full hover:bg-red-50 disabled:opacity-60"
                        >
                          Delete topic
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {Array.isArray(section.photos) && section.photos.length > 0 ? (
                    <div className="grid gap-6 mt-6 md:grid-cols-3">
                      {section.photos.map((p) => (
                        <div
                          key={p._id}
                          className="p-4 border shadow-sm rounded-3xl border-slate-200/80 bg-clay/40"
                        >
                          <a
                            href={toAssetUrl(p.url, import.meta.env.VITE_API_ASSET)}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                            title="Open full image"
                          >
                            <div className="ka-frame ka-mediaBg aspect-[4/3] w-full">
                              <img
                                src={toAssetUrl(p.url, import.meta.env.VITE_API_ASSET)}
                                alt={section.title}
                                className="object-contain w-full h-full p-3 bg-white"
                                loading="lazy"
                              />
                            </div>
                          </a>

                          {isAdmin ? (
                            <button
                              type="button"
                              disabled={dynBusy}
                              onClick={() => removePhoto(p._id)}
                              className="inline-flex items-center gap-2 px-4 py-2 mt-4 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-full hover:bg-red-50 disabled:opacity-60"
                            >
                              <FiTrash2 />
                              Remove
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-6 text-sm text-muted">
                      {isAdmin ? 'No photos yet. Use “Add photo” to upload.' : 'No photos yet.'}
                    </p>
                  )}
                </div>
              ))}

              {dynamicSections.length === 0 && !dynLoading ? (
                <div className="p-8 text-sm bg-white border shadow-sm rounded-3xl border-slate-200/80 text-muted">
                  {isAdmin
                    ? 'No custom topics yet. Click “Add new topic” to create one.'
                    : 'No extra gallery topics available right now.'}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}

export default Gallery
