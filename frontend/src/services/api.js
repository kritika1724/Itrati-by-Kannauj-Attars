const API_BASE = import.meta.env.VITE_API_BASE || '/api'
const PUBLIC_CACHE_TTL_MS = 90_000
const STATIC_DATA_CACHE_TTL_MS = 5 * 60_000
const PRIVATE_CACHE_TTL_MS = 30_000

const responseCache = new Map()
const inflightRequests = new Map()

const getCacheKey = (path, options = {}) => `${options.method || 'GET'} ${path}`

const getCachedResponse = (key, allowExpired = false) => {
  const entry = responseCache.get(key)
  if (!entry) return null
  if (!allowExpired && entry.expiresAt <= Date.now()) {
    responseCache.delete(key)
    return null
  }
  return entry.data
}

const setCachedResponse = (key, data, ttlMs) => {
  responseCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  })
}

const invalidateCache = (pathPrefix = '') => {
  const needle = ` ${pathPrefix}`
  responseCache.forEach((_value, key) => {
    if (!pathPrefix || key.includes(needle)) responseCache.delete(key)
  })
}

let memoryToken = null
const getToken = () => memoryToken || localStorage.getItem('token')
const setToken = (token) => {
  memoryToken = token || null
}

let bootstrapped = false

let refreshPromise = null

const sessionRefresh = async () => {
  // Avoid parallel refresh calls.
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/session/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (r) => {
        if (!r.ok) throw new Error('Not authorized')
        return r.json()
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

const request = async (path, options = {}, _retried = false) => {
  const { cacheTtlMs = 0, forceFresh = false, ...fetchOptions } = options
  const method = fetchOptions.method || 'GET'
  const shouldCache = method === 'GET' && cacheTtlMs > 0
  const cacheKey = shouldCache ? getCacheKey(path, fetchOptions) : ''

  if (shouldCache && !forceFresh) {
    const cached = getCachedResponse(cacheKey)
    if (cached) return cached

    const pending = inflightRequests.get(cacheKey)
    if (pending) return pending

    const next = request(path, { ...options, forceFresh: true }, _retried).finally(() => {
      inflightRequests.delete(cacheKey)
    })
    inflightRequests.set(cacheKey, next)
    return next
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  }

  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...fetchOptions,
      headers,
    })
  } catch (e) {
    if (shouldCache) {
      const stale = getCachedResponse(cacheKey, true)
      if (stale) return stale
    }
    // Network error / CORS / backend not running.
    throw new Error(e?.message || 'Network error (backend not reachable)')
  }

  if (response.status === 401 && !_retried && !path.startsWith('/session/refresh')) {
    // Try a single silent refresh (cookie-based) and retry once.
    try {
      const refreshed = await sessionRefresh()
      if (refreshed?.token) setToken(refreshed.token)
      // Also sync user cache if provided.
      if (refreshed?.user) localStorage.setItem('user', JSON.stringify(refreshed.user))
      return request(path, options, true)
    } catch {
      // fallthrough
    }
  }

  if (!response.ok) {
    // Try JSON first, then plain text (express 404 often returns text/html).
    let message = ''
    let errorData = null
    try {
      const data = await response.json()
      errorData = data
      message = data?.message || ''
    } catch {
      try {
        const text = await response.text()
        message = (text || '').slice(0, 200)
      } catch {
        message = ''
      }
    }

    const statusLine = `${response.status}${response.statusText ? ` ${response.statusText}` : ''}`
    const finalMessage =
      message ||
      (response.status === 404
        ? `API endpoint not found (${statusLine}). Restart backend and confirm VITE_API_BASE.`
        : `Request failed (${statusLine}).`)
    const error = new Error(finalMessage)
    error.status = response.status
    error.field = errorData?.field || ''
    error.duplicateFields = Array.isArray(errorData?.duplicateFields) ? errorData.duplicateFields : []
    throw error
  }

  if (response.status === 204) {
    return null
  }

  const data = await response.json()
  if (shouldCache) {
    setCachedResponse(cacheKey, data, cacheTtlMs)
    inflightRequests.delete(cacheKey)
  }
  return data
}

export const api = {
  login: (payload) => request('/users/login', { method: 'POST', body: JSON.stringify(payload) }),
  me: () => request('/users/me'),
  sessionRefresh: () => sessionRefresh(),
  sessionLogout: async () => {
    const res = await fetch(`${API_BASE}/session/logout`, { method: 'POST', credentials: 'include' })
    if (!res.ok) throw new Error('Logout failed')
    return res.json()
  },
  getProducts: (params = {}) => {
    const { forceFresh = false, ...queryParams } = params
    const qs = new URLSearchParams(
      Object.entries(queryParams).filter(([, value]) => value !== undefined && value !== '')
    ).toString()
    return request(`/products${qs ? `?${qs}` : ''}`, {
      cacheTtlMs: PUBLIC_CACHE_TTL_MS,
      forceFresh,
    })
  },
  getTaxonomy: () =>
    request('/taxonomy', {
      cacheTtlMs: STATIC_DATA_CACHE_TTL_MS,
    }),
  createTaxonomyTerm: (payload) =>
    request('/taxonomy', { method: 'POST', body: JSON.stringify(payload) }).then((data) => {
      invalidateCache('/taxonomy')
      return data
    }),
  updateTaxonomyTerm: (group, slug, payload) =>
    request(`/taxonomy/${encodeURIComponent(group)}/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }).then((data) => {
      invalidateCache('/taxonomy')
      return data
    }),
  deleteTaxonomyTerm: (group, slug) =>
    request(`/taxonomy/${encodeURIComponent(group)}/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    }).then((data) => {
      invalidateCache('/taxonomy')
      return data
    }),
  getProduct: (id) => request(`/products/${id}`, { cacheTtlMs: PUBLIC_CACHE_TTL_MS }),
  createProduct: (payload) =>
    request('/products', { method: 'POST', body: JSON.stringify(payload) }).then((data) => {
      invalidateCache('/products')
      return data
    }),
  updateProduct: (id, payload) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }).then((data) => {
      invalidateCache('/products')
      return data
    }),
  deleteProduct: (id) =>
    request(`/products/${id}`, { method: 'DELETE' }).then((data) => {
      invalidateCache('/products')
      return data
    }),
  addReview: (id, payload) =>
    request(`/products/${id}/reviews`, { method: 'POST', body: JSON.stringify(payload) }).then((data) => {
      invalidateCache('/products')
      return data
    }),
  deleteReview: (id, reviewId) =>
    request(`/products/${id}/reviews/${encodeURIComponent(reviewId)}`, { method: 'DELETE' }).then((data) => {
      invalidateCache('/products')
      return data
    }),
  createOrder: (payload) =>
    request('/orders', { method: 'POST', body: JSON.stringify(payload) }).then((data) => {
      invalidateCache('/orders')
      return data
    }),
  getMyOrders: () => request('/orders/mine', { cacheTtlMs: PRIVATE_CACHE_TTL_MS }),
  getOrder: (id) => request(`/orders/${id}`, { cacheTtlMs: PRIVATE_CACHE_TTL_MS }),
  trackOrder: (publicOrderId, contact) =>
    request(`/orders/track/${encodeURIComponent(publicOrderId)}?whatsapp=${encodeURIComponent(contact || '')}`),
  cancelTrackedOrder: (publicOrderId, contact) =>
    request(`/orders/track/${encodeURIComponent(publicOrderId)}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ whatsapp: contact || '' }),
    }),
  getAllOrders: () => request('/orders', { cacheTtlMs: PRIVATE_CACHE_TTL_MS }),
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }).then((data) => {
      invalidateCache('/orders')
      invalidateCache('/admin/stats')
      return data
    }),
  deleteOrder: (id) =>
    request(`/orders/${id}`, { method: 'DELETE' }).then((data) => {
      invalidateCache('/orders')
      invalidateCache('/admin/stats')
      return data
    }),
  cancelOrder: (id) =>
    request(`/orders/${id}/cancel`, { method: 'PUT' }).then((data) => {
      invalidateCache('/orders')
      invalidateCache('/admin/stats')
      return data
    }),
  adminStats: () => request('/admin/stats', { cacheTtlMs: PRIVATE_CACHE_TTL_MS }),
  // Razorpay payments
  createRazorpayOrder: (payloadOrOrderId) =>
    request('/payments/razorpay/order', {
      method: 'POST',
      body: JSON.stringify(
        typeof payloadOrOrderId === 'object' && payloadOrOrderId !== null
          ? payloadOrOrderId
          : { orderId: payloadOrOrderId }
      ),
    }),
  verifyRazorpayPayment: (payload) =>
    request('/payments/razorpay/verify', { method: 'POST', body: JSON.stringify(payload) }).then((data) => {
      invalidateCache('/orders')
      invalidateCache('/admin/stats')
      return data
    }),
  uploadMedia: async (file) => {
    const token = getToken()
    const formData = new FormData()
    formData.append('file', file, file?.name || 'upload')

    let response
    try {
      response = await fetch(`${API_BASE}/uploads`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })
    } catch (e) {
      throw new Error(
        e?.message ||
          `Failed to fetch (backend not reachable / CORS blocked). Check backend port + CORS_ORIGIN. (API_BASE=${API_BASE})`
      )
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }))
      const message = error.message || 'Upload failed'
      throw new Error(
        /unexpected file/i.test(message)
          ? 'Backend is still using the old upload handler. Restart backend once, then try the MP4 again.'
          : message
      )
    }

    return response.json()
  },
  uploadImage: async (file) => {
    return api.uploadMedia(file)
  },

  // Site media (admin)
  getAssets: () =>
    request('/assets', {
      cacheTtlMs: STATIC_DATA_CACHE_TTL_MS,
    }),
  setAsset: (key, url) =>
    request(`/assets/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ url }) }).then((data) => {
      invalidateCache('/assets')
      return data
    }),
  deleteAsset: (key) =>
    request(`/assets/${encodeURIComponent(key)}`, { method: 'DELETE' }).then((data) => {
      invalidateCache('/assets')
      return data
    }),

  // Site content (admin-editable important text blocks)
  getSiteContent: () =>
    request('/site-content', {
      cacheTtlMs: STATIC_DATA_CACHE_TTL_MS,
    }),
  setSiteContent: (key, value) =>
    request(`/site-content/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }).then((data) => {
      invalidateCache('/site-content')
      return data
    }),
  deleteSiteContent: (key) =>
    request(`/site-content/${encodeURIComponent(key)}`, { method: 'DELETE' }).then((data) => {
      invalidateCache('/site-content')
      return data
    }),

  // Contact form
  submitContact: (payload) => request('/contact', { method: 'POST', body: JSON.stringify(payload) }),
  joinFragranceClub: async (payload) => {
    try {
      return await request('/fragrance-club/join', { method: 'POST', body: JSON.stringify(payload) })
    } catch (error) {
      if (error?.status === 404) {
        return request('/fragrance-club', { method: 'POST', body: JSON.stringify(payload) })
      }
      throw error
    }
  },
  getFragranceClubMembers: () => request('/fragrance-club/members', { cacheTtlMs: PRIVATE_CACHE_TTL_MS }),
  getFragranceClubCampaigns: () => request('/fragrance-club/campaigns', { cacheTtlMs: PRIVATE_CACHE_TTL_MS }),
  createFragranceClubCampaign: (payload) =>
    request('/fragrance-club/campaigns', { method: 'POST', body: JSON.stringify(payload) }).then((data) => {
      invalidateCache('/fragrance-club/campaigns')
      return data
    }),
  updateFragranceClubCampaignStatus: (id, status) =>
    request(`/fragrance-club/campaigns/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }).then((data) => {
      invalidateCache('/fragrance-club/campaigns')
      return data
    }),
  // Admin contact inbox
  getContactMessages: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
    ).toString()
    return request(`/contact${qs ? `?${qs}` : ''}`, { cacheTtlMs: PRIVATE_CACHE_TTL_MS })
  },
  markContactRead: (id) =>
    request(`/contact/${id}/read`, { method: 'PUT' }).then((data) => {
      invalidateCache('/contact')
      return data
    }),
  deleteContactMessage: (id) =>
    request(`/contact/${id}`, { method: 'DELETE' }).then((data) => {
      invalidateCache('/contact')
      return data
    }),

  // Gallery (dynamic sections)
  getGallery: () => request('/gallery', { cacheTtlMs: PUBLIC_CACHE_TTL_MS }),
  createGallerySection: (payload) =>
    request('/gallery/sections', { method: 'POST', body: JSON.stringify(payload) }).then((data) => {
      invalidateCache('/gallery')
      return data
    }),
  deleteGallerySection: (id) =>
    request(`/gallery/sections/${id}`, { method: 'DELETE' }).then((data) => {
      invalidateCache('/gallery')
      return data
    }),
  addGalleryMedia: (payload) =>
    request('/gallery/photos', { method: 'POST', body: JSON.stringify(payload) }).then((data) => {
      invalidateCache('/gallery')
      return data
    }),
  addGalleryPhoto: (sectionId, payload) =>
    request(`/gallery/sections/${sectionId}/photos`, { method: 'POST', body: JSON.stringify(payload) }).then((data) => {
      invalidateCache('/gallery')
      return data
    }),
  updateGalleryPhoto: (id, payload) =>
    request(`/gallery/photos/${id}`, { method: 'PUT', body: JSON.stringify(payload) }).then((data) => {
      invalidateCache('/gallery')
      return data
    }),
  deleteGalleryPhoto: (id) =>
    request(`/gallery/photos/${id}`, { method: 'DELETE' }).then((data) => {
      invalidateCache('/gallery')
      return data
    }),
}

export const auth = {
  getUser: () => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  },
  setSession: (data) => {
    // Access token kept in-memory (more secure than localStorage).
    setToken(data.token)
    localStorage.removeItem('token')
    const u = data.user || {}
    localStorage.setItem(
      'user',
      JSON.stringify({
        ...u,
        isAdmin: u.isAdmin === true,
        role: u.role || (u.isAdmin === true ? 'admin' : 'user'),
      })
    )
    // Let the app (navbar, protected links) update immediately.
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('authchange'))
  },
  clearSession: () => {
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('authchange'))
  },
  isBootstrapped: () => bootstrapped,
  markBootstrapped: () => {
    bootstrapped = true
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('authboot'))
  },
}
