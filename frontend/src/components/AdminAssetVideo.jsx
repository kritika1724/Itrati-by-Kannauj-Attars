import { useEffect, useMemo, useState } from 'react'
import { auth } from '../services/api'
import { useSiteAssets } from './SiteAssetsProvider'
import { toAssetUrl } from '../utils/media'

function AdminAssetVideo({
  assetKey,
  className = '',
  videoClassName = '',
  defaultAspect = '21 / 7',
  useAspectRatio = true,
  showPlaceholder = true,
  autoPlay = true,
  muted = true,
  loop = true,
  showControlsForAdmin = true,
}) {
  const { assets, uploadAndSetAsset } = useSiteAssets()
  const [user, setUser] = useState(auth.getUser())
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const onAuth = () => setUser(auth.getUser())
    window.addEventListener('authchange', onAuth)
    return () => window.removeEventListener('authchange', onAuth)
  }, [])

  const src = useMemo(() => {
    const raw = assets?.[assetKey] || ''
    return raw ? toAssetUrl(raw, import.meta.env.VITE_API_ASSET) : ''
  }, [assetKey, assets])

  const upload = async (file) => {
    setBusy(true)
    setMessage('')
    try {
      await uploadAndSetAsset(assetKey, file)
      setMessage('Video updated.')
    } catch (e) {
      setMessage(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!src && user?.isAdmin !== true && !showPlaceholder) {
    return null
  }

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={useAspectRatio && defaultAspect ? { aspectRatio: defaultAspect } : undefined}
    >
      {src ? (
        <video
          src={src}
          className={`h-full w-full object-cover ${videoClassName}`}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline
          controls={showControlsForAdmin && user?.isAdmin === true}
          preload="metadata"
        />
      ) : showPlaceholder ? (
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(35,60,122,0.12),rgba(255,255,255,0.96),rgba(201,162,74,0.16))]">
          <div className="rounded-full border border-gold/35 bg-[rgba(255,250,244,0.9)] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-emberDark shadow-sm">
            Home top video
          </div>
        </div>
      ) : null}

      {user?.isAdmin === true ? (
        <div className="absolute inset-x-3 bottom-3 z-30 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/20 bg-black/40 p-3 backdrop-blur-md">
          <label className="text-[11px] font-semibold text-white/90">
            {src ? 'Change video' : 'Upload video'}
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/ogg,video/x-m4v,.mp4,.webm,.mov,.m4v,.ogg"
              disabled={busy}
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

export default AdminAssetVideo
