import { useEffect, useMemo, useState } from 'react'
import { getMediaAccept, isVideoAssetUrl, toAssetUrl } from '../utils/media'
import { useSiteAssets } from '../components/SiteAssetsProvider'
import { SITE_ASSET_KEYS } from '../config/siteAssets'
import { useAutoplayVideo } from '../hooks/useAutoplayVideo'

const clampZoom = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  return Math.min(Math.max(n, 1), 2.5)
}

function AutoplayVideoPreview({ src, className = '' }) {
  const videoRef = useAutoplayVideo(src)

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      autoPlay
      muted
      defaultMuted
      loop
      playsInline
      controls
      disablePictureInPicture
      disableRemotePlayback
      preload="auto"
    />
  )
}

function AdminMedia() {
  const { assets, refresh, uploadAndSetAsset, deleteAssetKey, setAssetUrl } = useSiteAssets()
  const [message, setMessage] = useState('')
  const [busyKey, setBusyKey] = useState('')
  const [zoomDrafts, setZoomDrafts] = useState({})
  const imageOnlyKeys = useMemo(
    () => new Set(['site.logo', 'site.favicon', 'site.wordmark', 'about.ceo.photo']),
    []
  )

  const rows = useMemo(
    () =>
      SITE_ASSET_KEYS.map((k) => ({
        ...k,
        url: assets[k.key] || '',
      })),
    [assets]
  )

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    const next = SITE_ASSET_KEYS.reduce((acc, row) => {
      if (row.type !== 'video' && !isVideoAssetUrl(assets[row.key])) {
        acc[row.key] = clampZoom(assets[`${row.key}.zoom`])
      }
      return acc
    }, {})
    setZoomDrafts(next)
  }, [assets])

  const uploadAndSet = async (key, file) => {
    setBusyKey(key)
    setMessage('')
    try {
      await uploadAndSetAsset(key, file)
      setMessage('Media updated.')
    } catch (e) {
      setMessage(e.message)
    } finally {
      setBusyKey('')
    }
  }

  const allowsVideo = (row) => row.type === 'video' || !imageOnlyKeys.has(row.key)
  const isVideoRow = (row) => allowsVideo(row) && (row.type === 'video' || isVideoAssetUrl(row.url))
  const getRowZoom = (key) => clampZoom(zoomDrafts[key])

  const saveImageZoom = async (key) => {
    const zoomKey = `${key}.zoom`
    setBusyKey(zoomKey)
    setMessage('')
    try {
      await setAssetUrl(zoomKey, String(getRowZoom(key)))
      setMessage('Image zoom updated.')
    } catch (e) {
      setMessage(e.message)
    } finally {
      setBusyKey('')
    }
  }

  const updateZoomDraft = (key, value) => {
    setZoomDrafts((prev) => ({ ...prev, [key]: clampZoom(value) }))
  }

  const clear = async (key) => {
    if (!window.confirm('Remove this media?')) return
    setBusyKey(key)
    setMessage('')
    try {
      await deleteAssetKey(key)
      setMessage('Media removed.')
    } catch (e) {
      setMessage(e.message)
    } finally {
      setBusyKey('')
    }
  }

  return (
    <div className="bg-sand min-h-screen">
      <header className="px-6 pb-10 pt-12">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-xs uppercase tracking-[0.35em] text-muted">Admin</p>
          <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">Website Media</h1>
          <p className="mt-3 text-sm text-muted">
            Upload/replace images and videos used across Home and Gallery. Product media remains in Products.
          </p>
          {message && <p className="mt-4 text-sm font-semibold text-emberDark">{message}</p>}
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
          <div className="grid gap-5">
            {rows.map((row) => (
              <div
                key={row.key}
                className="grid gap-4 rounded-2xl border border-slate-200/80 bg-clay/50 p-4 md:grid-cols-[220px_1fr_auto]"
              >
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {row.url ? (
                    isVideoRow(row) ? (
                      <AutoplayVideoPreview
                        src={toAssetUrl(row.url, import.meta.env.VITE_API_ASSET)}
                        className="h-44 w-full object-cover"
                      />
                    ) : (
                      <img
                        src={toAssetUrl(row.url, import.meta.env.VITE_API_ASSET)}
                        alt={row.label}
                        className="h-44 w-full object-contain transition-transform duration-300"
                        style={{ transform: `scale(${getRowZoom(row.key)})` }}
                        loading="lazy"
                      />
                    )
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center text-xs font-semibold text-muted">
                      No {allowsVideo(row) ? 'media' : 'image'}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-ink">{row.label}</p>
                  <p className="mt-1 text-xs text-muted">{row.key}</p>
                  <div className="mt-4">
                    <label className="text-xs font-semibold text-muted">
                      Upload new {allowsVideo(row) ? 'image or video' : 'image'}
                    </label>
                    <input
                      type="file"
                      accept={getMediaAccept(allowsVideo(row) ? 'media' : 'image')}
                      disabled={busyKey === row.key}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) uploadAndSet(row.key, file)
                      }}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink file:mr-4 file:rounded-full file:border-0 file:bg-ember file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-emberDark disabled:opacity-60"
                    />
                    <p className="mt-2 text-[11px] text-muted">
                      {isVideoRow(row)
                        ? 'Tip: MP4 works best for broad browser support.'
                        : allowsVideo(row)
                          ? 'Tip: JPG/PNG for images, MP4 for videos. HEIC may not display in browsers.'
                          : 'Tip: JPG/PNG works best. HEIC may not display in browsers.'}
                    </p>
                  </div>
                  {!isVideoRow(row) ? (
                    <div className="mt-5 rounded-2xl border border-gold/25 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted">
                            Image zoom
                          </p>
                          <p className="mt-1 text-[11px] text-muted">
                            Use this after uploading to zoom/crop the image inside its website frame.
                          </p>
                        </div>
                        <span className="rounded-full border border-slate-200 bg-clay px-3 py-1 text-[11px] font-semibold text-emberDark">
                          {Math.round(getRowZoom(row.key) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="2.5"
                        step="0.05"
                        value={getRowZoom(row.key)}
                        disabled={busyKey === `${row.key}.zoom`}
                        onChange={(e) => updateZoomDraft(row.key, e.target.value)}
                        className="mt-4 w-full accent-[#C9A24A]"
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busyKey === `${row.key}.zoom`}
                          onClick={() => saveImageZoom(row.key)}
                          className="rounded-full border border-gold/35 bg-ember px-4 py-2 text-xs font-semibold text-white transition hover:bg-emberDark disabled:opacity-50"
                        >
                          Save zoom
                        </button>
                        <button
                          type="button"
                          disabled={busyKey === `${row.key}.zoom`}
                          onClick={() => updateZoomDraft(row.key, 1)}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark transition hover:border-gold/40 disabled:opacity-50"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-start gap-3 md:justify-end">
                  <button
                    type="button"
                    disabled={!row.url || busyKey === row.key}
                    onClick={() => clear(row.key)}
                    className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminMedia
