import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus, FiSave, FiTrash2 } from 'react-icons/fi'
import AdminAssetImage from '../components/AdminAssetImage'
import AdminAssetMediaGrid from '../components/AdminAssetMediaGrid'
import { BUSINESS } from '../config/business'
import { useSiteContactProfile } from '../hooks/useSiteContentBlocks'
import { api, auth } from '../services/api'
import { getMediaAccept, getResponsiveImageProps, isVideoAssetUrl, toAssetUrl } from '../utils/media'

const fade = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0 },
}

function GalleryMediaPreview({ media, alt }) {
  const src = toAssetUrl(media.url, import.meta.env.VITE_API_ASSET)
  const isVideo = media.kind === 'video' || isVideoAssetUrl(media.url)
  const imageProps = !isVideo
    ? getResponsiveImageProps(media.url, {
        assetBase: import.meta.env.VITE_API_ASSET,
        widths: [320, 480, 640, 960, 1280],
        sizes: '(max-width: 767px) 100vw, 50vw',
        width: 960,
      })
    : null

  if (isVideo) {
    return (
      <video
        src={src}
        className="object-contain w-full h-full p-2 bg-white"
        controls
        playsInline
        preload="metadata"
      />
    )
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noreferrer"
      className="block w-full h-full"
      title="Open full image"
    >
      <img
        {...(imageProps || { src })}
        alt={alt}
        className="object-contain w-full h-full p-3 bg-white"
        loading="lazy"
        decoding="async"
      />
    </a>
  )
}

function Gallery() {
  const [user, setUser] = useState(auth.getUser())
  const contactProfile = useSiteContactProfile()
  const isAdmin = user?.isAdmin === true

  const [standaloneMedia, setStandaloneMedia] = useState([])
  const [dynamicSections, setDynamicSections] = useState([])
  const [dynLoading, setDynLoading] = useState(false)
  const [dynError, setDynError] = useState('')
  const [dynMessage, setDynMessage] = useState('')

  const [newOpen, setNewOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [dynBusy, setDynBusy] = useState(false)
  const [standaloneCaption, setStandaloneCaption] = useState('')
  const [uploadCaptions, setUploadCaptions] = useState({})
  const [captionDrafts, setCaptionDrafts] = useState({})

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
      const directMedia = Array.isArray(data?.standaloneMedia) ? data.standaloneMedia : []
      const sections = Array.isArray(data?.sections) ? data.sections : []
      setStandaloneMedia(directMedia)
      setDynamicSections(sections)
      setCaptionDrafts((prev) => {
        const next = {}
        directMedia.forEach((photo) => {
          next[photo._id] = prev[photo._id] ?? photo.caption ?? ''
        })
        sections.forEach((section) => {
          const photos = section.photos || []
          photos.forEach((photo) => {
            next[photo._id] = prev[photo._id] ?? photo.caption ?? ''
          })
        })
        return next
      })
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

  const addStandaloneMedia = async (fileList) => {
    const files = Array.from(fileList || []).filter(Boolean)
    if (!files.length) return
    const caption = String(standaloneCaption || '').trim()
    setDynBusy(true)
    setDynError('')
    setDynMessage('')
    try {
      for (const file of files) {
        const uploaded = await api.uploadMedia(file)
        const url = uploaded.url || uploaded.absoluteUrl
        await api.addGalleryMedia({ url, kind: uploaded.kind, caption })
      }
      setDynMessage(`${files.length} gallery item${files.length === 1 ? '' : 's'} added.`)
      setStandaloneCaption('')
      await loadDynamic()
    } catch (e) {
      setDynError(e.message || 'Upload failed')
    } finally {
      setDynBusy(false)
    }
  }

  const addMediaToTopic = async (sectionId, fileList) => {
    const files = Array.from(fileList || []).filter(Boolean)
    if (!files.length) return
    const caption = String(uploadCaptions[sectionId] || '').trim()
    setDynBusy(true)
    setDynError('')
    setDynMessage('')
    try {
      for (const file of files) {
        const uploaded = await api.uploadMedia(file)
        const url = uploaded.url || uploaded.absoluteUrl
        await api.addGalleryPhoto(sectionId, { url, kind: uploaded.kind, caption })
      }
      setDynMessage(`${files.length} media item${files.length === 1 ? '' : 's'} added.`)
      setUploadCaptions((prev) => ({ ...prev, [sectionId]: '' }))
      await loadDynamic()
    } catch (e) {
      setDynError(e.message || 'Upload failed')
    } finally {
      setDynBusy(false)
    }
  }

  const updatePhotoHeading = async (photoId) => {
    setDynBusy(true)
    setDynError('')
    setDynMessage('')
    try {
      await api.updateGalleryPhoto(photoId, {
        caption: String(captionDrafts[photoId] || '').trim(),
      })
      setDynMessage('Heading updated.')
      await loadDynamic()
    } catch (e) {
      setDynError(e.message || 'Update failed')
    } finally {
      setDynBusy(false)
    }
  }

  const removePhoto = async (photoId) => {
    if (!window.confirm('Remove this media item?')) return
    setDynBusy(true)
    setDynError('')
    setDynMessage('')
    try {
      await api.deleteGalleryPhoto(photoId)
      setDynMessage('Media removed.')
      await loadDynamic()
    } catch (e) {
      setDynError(e.message || 'Remove failed')
    } finally {
      setDynBusy(false)
    }
  }

  const removeTopic = async (sectionId) => {
    if (!window.confirm('Delete this topic and all its media?')) return
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
                Two locations - one rooted in Kannauj, one for Mumbai trade and distribution.
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
                allowVideo
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
                allowVideo
              />
              <h3 className="mt-4 text-lg font-semibold text-ink">{contactProfile.offices.mumbai.label}</h3>
              <p className="mt-2 text-sm text-muted">{contactProfile.offices.mumbai.address}</p>
            </article>
          </div>

          <AdminAssetMediaGrid
            title="Office media"
            prefix="gallery.office.extra."
            description="Add unlimited office photos or videos: signboard, interiors, reception, storage, and dispatch."
            eyebrow="More media"
            allowVideo
            className="mt-10"
          />
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="w-full max-w-6xl mx-auto">
          <div className="max-w-3xl mb-8">
            <p className="ka-kicker">Section</p>
            <h2 className="mt-3 ka-h2">Factory & Craft</h2>
            <p className="mt-3 text-sm text-muted">
              A look inside the workspace, tools, storage, quality checks, and daily craft environment.
            </p>
          </div>

          <div className="grid gap-6">
            <div className="p-6 ka-card">
              <AdminAssetImage
                assetKey="gallery.factory.main"
                className="ka-frame aspect-[16/9] w-full bg-[radial-gradient(circle_at_top,rgba(201,162,74,0.26),rgba(255,255,255,0.94))]"
                imgClassName="p-2"
                defaultAspect="16 / 9"
                allowVideo
              />
              <h3 className="mt-4 text-lg font-semibold text-ink">Factory / Workshop</h3>
            
            </div>
          </div>

          <AdminAssetMediaGrid
            title="Factory / workshop media"
            prefix="gallery.factory.extra."
            description="Add unlimited factory photos or videos: workshop, tools, storage, quality checks, and team moments."
            eyebrow="More media"
            allowVideo
            className="mt-10"
          />
        </div>
      </section>

      {isAdmin || standaloneMedia.length > 0 ? (
        <section className="px-6 pb-20">
          <div className="w-full max-w-6xl mx-auto">
            <div className="p-6 bg-white border shadow-lg rounded-3xl border-slate-200/80 shadow-black/10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="ka-kicker">Gallery uploads</p>
                  
                </div>

                {isAdmin ? (
                  <div className="grid w-full gap-3 sm:w-auto sm:min-w-[20rem]">
                    <input
                      value={standaloneCaption}
                      onChange={(e) => setStandaloneCaption(e.target.value)}
                      placeholder="Heading for next image/video"
                      className="w-full px-4 py-2 text-sm bg-white border rounded-2xl border-slate-200 text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
                    />
                    <label className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white transition rounded-full cursor-pointer w-fit bg-ember hover:bg-emberDark">
                      <FiPlus />
                      Add media
                      <input
                        type="file"
                        multiple
                        disabled={dynBusy}
                        accept={getMediaAccept('media')}
                        onChange={(e) => {
                          addStandaloneMedia(e.target.files)
                          e.currentTarget.value = ''
                        }}
                        className="sr-only"
                      />
                    </label>
                  </div>
                ) : null}
              </div>

              {standaloneMedia.length > 0 ? (
                <div className="grid gap-6 mt-6 md:grid-cols-3">
                  {standaloneMedia.map((p) => (
                    <div key={p._id} className="p-4 border shadow-sm rounded-3xl border-slate-200/80 bg-clay/40">
                      <div className="ka-frame ka-mediaBg aspect-[4/3] w-full">
                        <GalleryMediaPreview media={p} alt={p.caption || 'Gallery media'} />
                      </div>

                      {isAdmin ? (
                        <div className="grid gap-3 mt-4">
                          <input
                            value={captionDrafts[p._id] ?? p.caption ?? ''}
                            onChange={(e) =>
                              setCaptionDrafts((prev) => ({ ...prev, [p._id]: e.target.value }))
                            }
                            placeholder="Image/video heading"
                            className="w-full px-4 py-2 text-sm bg-white border rounded-2xl border-slate-200 text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={dynBusy}
                              onClick={() => updatePhotoHeading(p._id)}
                              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white border rounded-full border-gold/25 text-emberDark hover:border-gold/45 disabled:opacity-60"
                            >
                              <FiSave />
                              Save heading
                            </button>
                            <button
                              type="button"
                              disabled={dynBusy}
                              onClick={() => removePhoto(p._id)}
                              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-full hover:bg-red-50 disabled:opacity-60"
                            >
                              <FiTrash2 />
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : p.caption ? (
                        <h3 className="mt-4 text-sm font-semibold text-ink">{p.caption}</h3>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : isAdmin ? (
                <p className="mt-6 text-sm text-muted">
                  No direct gallery media yet. Add a heading, then upload images or videos.
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {isAdmin || dynamicSections.length > 0 ? (
        <section className="px-6 pb-20">
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <p className="ka-kicker">Section</p>
                <h2 className="mt-3 ka-h2">More topics</h2>
                <p className="mt-3 text-sm text-muted">
                  Create any new topic and add unlimited photos or videos inside it - for example: Dispatch, Quality
                  checks, Awards, Storage, Lab, Team, Events.
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
                      <div className="grid w-full gap-3 sm:w-auto sm:min-w-[20rem]">
                        <input
                          value={uploadCaptions[section._id] || ''}
                          onChange={(e) =>
                            setUploadCaptions((prev) => ({ ...prev, [section._id]: e.target.value }))
                          }
                          placeholder="Heading for next photo/video"
                          className="w-full px-4 py-2 text-sm bg-white border rounded-2xl border-slate-200 text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
                        />
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white transition rounded-full cursor-pointer bg-ember hover:bg-emberDark">
                            <FiPlus />
                            Add media
                            <input
                              type="file"
                              multiple
                              disabled={dynBusy}
                              accept={getMediaAccept('media')}
                              onChange={(e) => {
                                addMediaToTopic(section._id, e.target.files)
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
                          <div className="ka-frame ka-mediaBg aspect-[4/3] w-full">
                            <GalleryMediaPreview media={p} alt={p.caption || section.title} />
                          </div>

                          {isAdmin ? (
                            <div className="grid gap-3 mt-4">
                              <input
                                value={captionDrafts[p._id] ?? p.caption ?? ''}
                                onChange={(e) =>
                                  setCaptionDrafts((prev) => ({ ...prev, [p._id]: e.target.value }))
                                }
                                placeholder="Photo/video heading"
                                className="w-full px-4 py-2 text-sm bg-white border rounded-2xl border-slate-200 text-ink placeholder:text-muted focus:border-ember focus:outline-none focus:ring-2 focus:ring-ember/15"
                              />
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={dynBusy}
                                  onClick={() => updatePhotoHeading(p._id)}
                                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-white border rounded-full border-gold/25 text-emberDark hover:border-gold/45 disabled:opacity-60"
                                >
                                  <FiSave />
                                  Save heading
                                </button>
                                <button
                                  type="button"
                                  disabled={dynBusy}
                                  onClick={() => removePhoto(p._id)}
                                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-full hover:bg-red-50 disabled:opacity-60"
                                >
                                  <FiTrash2 />
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : p.caption ? (
                            <h4 className="mt-4 text-sm font-semibold text-ink">{p.caption}</h4>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-6 text-sm text-muted">
                      {isAdmin ? 'No media yet. Add a heading, then upload photos or videos.' : 'No media yet.'}
                    </p>
                  )}
                </div>
              ))}

              {dynamicSections.length === 0 && !dynLoading ? (
                <div className="p-8 text-sm bg-white border shadow-sm rounded-3xl border-slate-200/80 text-muted">
                  {isAdmin
                    ? 'No custom topics yet. Click Add new topic to create one.'
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
