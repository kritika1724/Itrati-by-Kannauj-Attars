import { useEffect, useMemo, useState } from 'react'
import { getMediaAccept, isVideoAssetUrl, toAssetUrl } from '../utils/media'
import { useSiteAssets } from '../components/SiteAssetsProvider'
import { SITE_ASSET_KEYS } from '../config/siteAssets'
import { useAutoplayVideo } from '../hooks/useAutoplayVideo'
import fallbackWordmark from '../assets/itrati-wordmark-transparent-v3.png'

const WORDMARK_KEY = 'site.wordmark'
const WORDMARK_DEFAULT_URL = '/brand/itrati-wordmark-cropped.png'
const DEFAULT_MAX_ZOOM = 2.5
const WORDMARK_MAX_ZOOM = 8

const getMaxZoom = (key) => (key === WORDMARK_KEY ? WORDMARK_MAX_ZOOM : DEFAULT_MAX_ZOOM)

const clampZoom = (value, max = DEFAULT_MAX_ZOOM) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  return Math.min(Math.max(n, 1), max)
}

const clampOffset = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(Math.max(n, -50), 50)
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

function WordmarkFramePreview({ src, zoom, x, y }) {
  return (
    <div className="flex h-44 w-full items-center justify-center bg-[linear-gradient(180deg,rgba(255,250,244,0.95),rgba(245,238,226,0.92))] px-4">
      <div className="relative h-14 w-60 max-w-full overflow-hidden rounded-xl border border-gold/25 bg-white/70 shadow-sm">
        <div
          className="absolute inset-0 transition-transform duration-300"
          style={{
            transform: `translate(${x}%, ${y}%)`,
            transformOrigin: 'center',
          }}
        >
          <img
            src={src}
            alt="Itrati wordmark preview"
            className="h-full w-full object-contain drop-shadow-[0_4px_10px_rgba(145,102,16,0.22)] transition-transform duration-300"
            decoding="async"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center',
            }}
          />
        </div>
      </div>
    </div>
  )
}

function AdminMedia() {
  const { assets, refresh, uploadAndSetAsset, deleteAssetKey, setAssetUrl } = useSiteAssets()
  const [message, setMessage] = useState('')
  const [busyKey, setBusyKey] = useState('')
  const [zoomDrafts, setZoomDrafts] = useState({})
  const [positionDrafts, setPositionDrafts] = useState({})
  const imageOnlyKeys = useMemo(
    () => new Set(['site.logo', 'site.favicon', WORDMARK_KEY, 'about.ceo.photo']),
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
        acc[row.key] = clampZoom(assets[`${row.key}.zoom`], getMaxZoom(row.key))
      }
      return acc
    }, {})
    setZoomDrafts(next)

    setPositionDrafts({
      [WORDMARK_KEY]: {
        x: clampOffset(assets[`${WORDMARK_KEY}.x`]),
        y: clampOffset(assets[`${WORDMARK_KEY}.y`]),
      },
    })
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
  const getRowZoom = (key) => clampZoom(zoomDrafts[key], getMaxZoom(key))
  const getRowPosition = (key) => positionDrafts[key] || { x: 0, y: 0 }
  const getPreviewSrc = (row) => {
    if (row.url) return toAssetUrl(row.url, import.meta.env.VITE_API_ASSET)
    if (row.key === WORDMARK_KEY) return fallbackWordmark
    return ''
  }
  const isFallbackPreview = (row) => row.key === WORDMARK_KEY && !row.url

  const saveImagePlacement = async (key) => {
    const zoomKey = `${key}.zoom`
    setBusyKey(zoomKey)
    setMessage('')
    try {
      if (key === WORDMARK_KEY) {
        const position = getRowPosition(key)
        await Promise.all([
          setAssetUrl(zoomKey, String(getRowZoom(key))),
          setAssetUrl(`${key}.x`, String(clampOffset(position.x))),
          setAssetUrl(`${key}.y`, String(clampOffset(position.y))),
        ])
        setMessage('Wordmark placement updated.')
      } else {
        await setAssetUrl(zoomKey, String(getRowZoom(key)))
        setMessage('Image zoom updated.')
      }
    } catch (e) {
      setMessage(e.message)
    } finally {
      setBusyKey('')
    }
  }

  const updateZoomDraft = (key, value) => {
    setZoomDrafts((prev) => ({ ...prev, [key]: clampZoom(value, getMaxZoom(key)) }))
  }

  const updatePositionDraft = (key, axis, value) => {
    setPositionDrafts((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { x: 0, y: 0 }),
        [axis]: clampOffset(value),
      },
    }))
  }

  const useAlignedWordmark = async () => {
    setBusyKey(WORDMARK_KEY)
    setMessage('')
    try {
      await Promise.all([
        setAssetUrl(WORDMARK_KEY, WORDMARK_DEFAULT_URL),
        setAssetUrl(`${WORDMARK_KEY}.zoom`, '1'),
        setAssetUrl(`${WORDMARK_KEY}.x`, '0'),
        setAssetUrl(`${WORDMARK_KEY}.y`, '0'),
      ])
      setZoomDrafts((prev) => ({ ...prev, [WORDMARK_KEY]: 1 }))
      setPositionDrafts((prev) => ({ ...prev, [WORDMARK_KEY]: { x: 0, y: 0 } }))
      setMessage('Aligned Itrati wordmark applied.')
    } catch (e) {
      setMessage(e.message)
    } finally {
      setBusyKey('')
    }
  }

  const renderPreview = (row, previewSrc, fallbackPreview) => {
    if (!previewSrc) {
      return (
        <div className="flex h-44 w-full items-center justify-center text-xs font-semibold text-muted">
          No {allowsVideo(row) ? 'media' : 'image'}
        </div>
      )
    }

    if (row.key === WORDMARK_KEY) {
      return (
        <WordmarkFramePreview
          src={previewSrc}
          zoom={fallbackPreview ? 1 : getRowZoom(row.key)}
          x={fallbackPreview ? 0 : getRowPosition(row.key).x}
          y={fallbackPreview ? 0 : getRowPosition(row.key).y}
        />
      )
    }

    if (isVideoRow(row)) {
      return <AutoplayVideoPreview src={previewSrc} className="h-44 w-full object-cover" />
    }

    return (
      <img
        src={previewSrc}
        alt={row.label}
        className="h-44 w-full object-contain transition-transform duration-300"
        style={{ transform: fallbackPreview ? undefined : `scale(${getRowZoom(row.key)})` }}
        loading="lazy"
        decoding="async"
      />
    )
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
            Upload/replace the logo, Itrati wordmark image, and other website images/videos. Product media remains in Products.
          </p>
          {message && <p className="mt-4 text-sm font-semibold text-emberDark">{message}</p>}
        </div>
      </header>

      <section className="px-6 pb-16">
        <div className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-black/10">
          <div className="grid gap-5">
            {rows.map((row) => {
              const previewSrc = getPreviewSrc(row)
              const fallbackPreview = isFallbackPreview(row)

              return (
                <div
                  key={row.key}
                  className={`grid gap-4 rounded-2xl border p-4 md:grid-cols-[220px_1fr_auto] ${
                    row.key === WORDMARK_KEY
                      ? 'border-gold/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(245,238,226,0.78))]'
                      : 'border-slate-200/80 bg-clay/50'
                  }`}
                >
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    {renderPreview(row, previewSrc, fallbackPreview)}
                  </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{row.label}</p>
                    {row.key === WORDMARK_KEY ? (
                      <span className="rounded-full border border-gold/30 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emberDark">
                        Navbar Itrati image
                      </span>
                    ) : null}
                    {fallbackPreview ? (
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                        Default preview
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted">{row.key}</p>
                  {row.description ? <p className="mt-2 text-xs leading-5 text-muted">{row.description}</p> : null}
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
                          : row.key === WORDMARK_KEY
                            ? 'Tip: Use the aligned default below, or upload a transparent PNG wordmark.'
                            : 'Tip: JPG/PNG works best. HEIC may not display in browsers.'}
                    </p>
                  </div>
                  {!isVideoRow(row) && !fallbackPreview ? (
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
                        max={getMaxZoom(row.key)}
                        step="0.05"
                        value={getRowZoom(row.key)}
                        disabled={busyKey === `${row.key}.zoom`}
                        onChange={(e) => updateZoomDraft(row.key, e.target.value)}
                        className="mt-4 w-full accent-[#C9A24A]"
                      />
                      {row.key === WORDMARK_KEY ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <label className="block">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                              Horizontal
                            </span>
                            <input
                              type="range"
                              min="-50"
                              max="50"
                              step="1"
                              value={getRowPosition(row.key).x}
                              disabled={busyKey === `${row.key}.zoom`}
                              onChange={(e) => updatePositionDraft(row.key, 'x', e.target.value)}
                              className="mt-2 w-full accent-[#C9A24A]"
                            />
                          </label>
                          <label className="block">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted">
                              Vertical
                            </span>
                            <input
                              type="range"
                              min="-50"
                              max="50"
                              step="1"
                              value={getRowPosition(row.key).y}
                              disabled={busyKey === `${row.key}.zoom`}
                              onChange={(e) => updatePositionDraft(row.key, 'y', e.target.value)}
                              className="mt-2 w-full accent-[#C9A24A]"
                            />
                          </label>
                        </div>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busyKey === `${row.key}.zoom`}
                          onClick={() => saveImagePlacement(row.key)}
                          className="rounded-full border border-gold/35 bg-ember px-4 py-2 text-xs font-semibold text-white transition hover:bg-emberDark disabled:opacity-50"
                        >
                          {row.key === WORDMARK_KEY ? 'Save placement' : 'Save zoom'}
                        </button>
                        <button
                          type="button"
                          disabled={busyKey === `${row.key}.zoom`}
                          onClick={() => {
                            updateZoomDraft(row.key, 1)
                            if (row.key === WORDMARK_KEY) {
                              updatePositionDraft(row.key, 'x', 0)
                              updatePositionDraft(row.key, 'y', 0)
                            }
                          }}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-emberDark transition hover:border-gold/40 disabled:opacity-50"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-start gap-3 md:justify-end">
                  {row.key === WORDMARK_KEY ? (
                    <button
                      type="button"
                      disabled={busyKey === WORDMARK_KEY}
                      onClick={useAlignedWordmark}
                      className="rounded-full border border-gold/35 bg-white px-4 py-2 text-xs font-semibold text-emberDark transition hover:border-gold/60 disabled:opacity-50"
                    >
                      Use aligned default
                    </button>
                  ) : null}
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
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminMedia
