import { useEffect, useMemo, useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import AdminAssetImage from './AdminAssetImage'
import { useSiteAssets } from './SiteAssetsProvider'
import { auth } from '../services/api'
import { getMediaAccept } from '../utils/media'

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

function AdminAssetMediaGrid({
  title,
  prefix,
  description = '',
  eyebrow = 'More photos',
  allowVideo = false,
  aspect = '4 / 3',
  fit = 'contain',
  gridClassName = 'md:grid-cols-3',
  className = '',
}) {
  const { assets, uploadAndSetAsset, deleteAssetKey } = useSiteAssets()
  const [user, setUser] = useState(auth.getUser())
  const isAdmin = user?.isAdmin === true
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const mediaLabel = allowVideo ? 'media' : 'photo'

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

  const onAdd = async (fileList) => {
    const files = Array.from(fileList || []).filter(Boolean)
    if (!files.length) return

    setBusy(true)
    setMessage('')
    try {
      const stamp = Date.now()
      for (let index = 0; index < files.length; index += 1) {
        const key = `${prefix}${stamp + index}`
        await uploadAndSetAsset(key, files[index])
      }
      const noun = allowVideo
        ? `media item${files.length === 1 ? '' : 's'}`
        : `photo${files.length === 1 ? '' : 's'}`
      setMessage(`${files.length} ${noun} added.`)
    } catch (e) {
      setMessage(e.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const onRemove = async (key) => {
    if (!window.confirm(`Remove this ${mediaLabel}?`)) return
    setBusy(true)
    setMessage('')
    try {
      await deleteAssetKey(key)
      setMessage(`${mediaLabel[0].toUpperCase()}${mediaLabel.slice(1)} removed.`)
    } catch (e) {
      setMessage(e.message || 'Remove failed')
    } finally {
      setBusy(false)
    }
  }

  if (!isAdmin && keys.length === 0) return null

  return (
    <section className={className}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted">{eyebrow}</p>
          <h3 className="mt-3 text-lg font-semibold text-ink">{title}</h3>
          {description ? <p className="mt-2 text-sm leading-6 text-muted">{description}</p> : null}
        </div>
        {isAdmin ? (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-ember px-5 py-2 text-xs font-semibold text-white transition hover:bg-emberDark">
            <FiPlus />
            Add {mediaLabel}
            <input
              type="file"
              multiple
              disabled={busy}
              accept={getMediaAccept(allowVideo ? 'media' : 'image')}
              onChange={(e) => {
                onAdd(e.target.files)
                e.currentTarget.value = ''
              }}
              className="sr-only"
            />
          </label>
        ) : null}
      </div>

      {message ? <p className="mt-4 text-sm font-semibold text-emberDark">{message}</p> : null}

      {keys.length > 0 ? (
        <div className={`mt-6 grid gap-6 ${gridClassName}`}>
          {keys.map((key) => (
            <div key={key} className="relative rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <AdminAssetImage
                assetKey={key}
                className="ka-frame ka-mediaBg w-full"
                imgClassName="p-2"
                defaultAspect={aspect}
                fit={fit}
                allowVideo={allowVideo}
              />
              {isAdmin ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRemove(key)}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  title={`Remove ${mediaLabel}`}
                >
                  <FiTrash2 />
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : isAdmin ? (
        <p className="mt-6 rounded-2xl border border-dashed border-gold/30 bg-white/70 px-4 py-5 text-sm text-muted">
          No {mediaLabel} added yet.
        </p>
      ) : null}
    </section>
  )
}

export default AdminAssetMediaGrid
