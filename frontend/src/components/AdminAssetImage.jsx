import { useEffect, useMemo, useState } from 'react'
import { auth } from '../services/api'
import { useSiteAssets } from './SiteAssetsProvider'
import { getMediaAccept, isVideoAssetUrl, toAssetUrl } from '../utils/media'

const parseAspect = (value) => {
  if (!value) return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const str = String(value).trim()
  const m = str.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/)
  if (m) {
    const w = Number(m[1])
    const h = Number(m[2])
    if (w > 0 && h > 0) return w / h
  }
  const n = Number(str)
  return Number.isFinite(n) && n > 0 ? n : null
}

function AdminAssetImage({
  assetKey,
  className = '',
  imgClassName = '',
  defaultAspect = '16 / 9',
  fit = 'contain', // 'contain' (full photo) or 'cover' (cinematic crop)
  showPlaceholder = true,
  allowVideo = false,
}) {
  const { assets, uploadAndSetAsset } = useSiteAssets()
  const [user, setUser] = useState(auth.getUser())
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [aspect, setAspect] = useState(() => parseAspect(defaultAspect))

  useEffect(() => {
    const onAuth = () => setUser(auth.getUser())
    window.addEventListener('authchange', onAuth)
    return () => window.removeEventListener('authchange', onAuth)
  }, [])

  const url = assets?.[assetKey] || ''
  const src = useMemo(() => (url ? toAssetUrl(url, import.meta.env.VITE_API_ASSET) : ''), [url])
  const isVideo = allowVideo && isVideoAssetUrl(url)
  const imageZoom = Math.min(Math.max(Number(assets?.[`${assetKey}.zoom`]) || 1, 1), 2.5)

  const upload = async (file) => {
    setBusy(true)
    setMessage('')
    try {
      await uploadAndSetAsset(assetKey, file)
      setMessage('Updated.')
    } catch (e) {
      setMessage(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={aspect ? { aspectRatio: String(aspect) } : undefined}
    >
      {src ? (
        isVideo ? (
          <video
            src={src}
            className={`h-full w-full bg-white ${fit === 'cover' ? 'object-cover' : 'object-contain'} ${imgClassName}`}
            autoPlay
            muted
            loop
            playsInline
            controls={user?.isAdmin === true}
            preload="metadata"
          />
        ) : (
          <a href={src} target="_blank" rel="noreferrer" className="block h-full w-full">
            <img
              src={src}
              alt=""
              className={`h-full w-full bg-white ${fit === 'cover' ? 'object-cover' : 'object-contain'} ${imgClassName}`}
              style={{ transform: `scale(${imageZoom})` }}
              loading="lazy"
              onLoad={(e) => {
                const el = e.currentTarget
                if (el?.naturalWidth && el?.naturalHeight) {
                  setAspect(el.naturalWidth / el.naturalHeight)
                }
              }}
            />
          </a>
        )
      ) : showPlaceholder ? (
        <div className="h-full w-full bg-[radial-gradient(circle_at_top,rgba(201,162,74,0.18),rgba(255,255,255,0.92))]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(17,27,58,0.08),transparent,rgba(201,162,74,0.10))]" />
        </div>
      ) : null}

      {user?.isAdmin === true ? (
        <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/20 bg-black/40 p-3 backdrop-blur-md">
          <label className="text-[11px] font-semibold text-white/90">
            {src ? 'Change media' : 'Upload media'}
            <input
              type="file"
              disabled={busy}
              accept={getMediaAccept(allowVideo ? 'media' : 'image')}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) upload(file)
              }}
              className="mt-2 block w-full text-[11px] text-white file:mr-3 file:rounded-full file:border-0 file:bg-white/90 file:px-3 file:py-1 file:text-[11px] file:font-semibold file:text-ink hover:file:bg-white disabled:opacity-60"
            />
          </label>
          {message ? <p className="text-[11px] font-semibold text-white/90">{message}</p> : null}
        </div>
      ) : null}
    </div>
  )
}

export default AdminAssetImage
