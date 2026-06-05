import { useEffect } from 'react'
import { api, auth } from '../services/api'

// Keeps localStorage user in-sync with backend (/users/me), so admin UI doesn't
// accidentally show for normal users due to stale cached "isAdmin" values.
function AuthBootstrap() {
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        // Try cookie-based session refresh first (professional secure session).
        const refreshed = await api.sessionRefresh()
        if (cancelled) return

        if (refreshed?.token && refreshed?.user) {
          auth.setSession(refreshed)
        }

        const me = await api.me()
        if (cancelled) return

        const prev = auth.getUser()
        const next = {
          id: me.id,
          name: me.name,
          email: me.email,
          isAdmin: !!me.isAdmin,
          role: me.role || (me.isAdmin ? 'admin' : 'user'),
        }

        // Only update if something changed to avoid noisy rerenders.
        if (
          !prev ||
          prev.email !== next.email ||
          Boolean(prev.isAdmin) !== Boolean(next.isAdmin) ||
          (prev.role || '') !== (next.role || '')
        ) {
          localStorage.setItem('user', JSON.stringify(next))
          window.dispatchEvent(new Event('authchange'))
        }
      } catch (e) {
        // Token invalid or backend unreachable: don't keep stale sessions around.
        if (cancelled) return
        auth.clearSession()
      } finally {
        auth.markBootstrapped()
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return null
}

export default AuthBootstrap
