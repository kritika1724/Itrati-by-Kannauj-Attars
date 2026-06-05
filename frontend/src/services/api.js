const API_BASE = import.meta.env.VITE_API_BASE || '/api'

const withCacheBust = (path) => {
  const separator = path.includes('?') ? '&' : '?'
  return `${path}${separator}_=${Date.now()}`
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
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    })
  } catch (e) {
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

  return response.json()
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
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
    ).toString()
    return request(`/products${qs ? `?${qs}` : ''}`)
  },
  getTaxonomy: () =>
    request('/taxonomy', {
      cache: 'no-store',
    }),
  createTaxonomyTerm: (payload) =>
    request('/taxonomy', { method: 'POST', body: JSON.stringify(payload) }),
  updateTaxonomyTerm: (group, slug, payload) =>
    request(`/taxonomy/${encodeURIComponent(group)}/${encodeURIComponent(slug)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteTaxonomyTerm: (group, slug) =>
    request(`/taxonomy/${encodeURIComponent(group)}/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
    }),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (payload) =>
    request('/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id, payload) =>
    request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  addReview: (id, payload) =>
    request(`/products/${id}/reviews`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteReview: (id, reviewId) =>
    request(`/products/${id}/reviews/${encodeURIComponent(reviewId)}`, { method: 'DELETE' }),
  createOrder: (payload) => request('/orders', { method: 'POST', body: JSON.stringify(payload) }),
  getMyOrders: () => request('/orders/mine'),
  getOrder: (id) => request(`/orders/${id}`),
  trackOrder: (publicOrderId, contact) =>
    request(`/orders/track/${encodeURIComponent(publicOrderId)}?whatsapp=${encodeURIComponent(contact || '')}`),
  cancelTrackedOrder: (publicOrderId, contact) =>
    request(`/orders/track/${encodeURIComponent(publicOrderId)}/cancel`, {
      method: 'PUT',
      body: JSON.stringify({ whatsapp: contact || '' }),
    }),
  getAllOrders: () => request('/orders'),
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: 'DELETE' }),
  cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: 'PUT' }),
  adminStats: () => request('/admin/stats'),
  // Razorpay payments
  createRazorpayOrder: (orderId) =>
    request('/payments/razorpay/order', { method: 'POST', body: JSON.stringify({ orderId }) }),
  verifyRazorpayPayment: (payload) =>
    request('/payments/razorpay/verify', { method: 'POST', body: JSON.stringify(payload) }),
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
    request(withCacheBust('/assets'), {
      cache: 'no-store',
    }),
  setAsset: (key, url) => request(`/assets/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify({ url }) }),
  deleteAsset: (key) => request(`/assets/${encodeURIComponent(key)}`, { method: 'DELETE' }),

  // Site content (admin-editable important text blocks)
  getSiteContent: () =>
    request(withCacheBust('/site-content'), {
      cache: 'no-store',
    }),
  setSiteContent: (key, value) =>
    request(`/site-content/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    }),
  deleteSiteContent: (key) => request(`/site-content/${encodeURIComponent(key)}`, { method: 'DELETE' }),

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
  getFragranceClubMembers: () => request('/fragrance-club/members'),
  getFragranceClubCampaigns: () => request('/fragrance-club/campaigns'),
  createFragranceClubCampaign: (payload) =>
    request('/fragrance-club/campaigns', { method: 'POST', body: JSON.stringify(payload) }),
  updateFragranceClubCampaignStatus: (id, status) =>
    request(`/fragrance-club/campaigns/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  // Admin contact inbox
  getContactMessages: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
    ).toString()
    return request(`/contact${qs ? `?${qs}` : ''}`)
  },
  markContactRead: (id) => request(`/contact/${id}/read`, { method: 'PUT' }),
  deleteContactMessage: (id) => request(`/contact/${id}`, { method: 'DELETE' }),

  // Gallery (dynamic sections)
  getGallery: () => request('/gallery'),
  createGallerySection: (payload) =>
    request('/gallery/sections', { method: 'POST', body: JSON.stringify(payload) }),
  deleteGallerySection: (id) => request(`/gallery/sections/${id}`, { method: 'DELETE' }),
  addGalleryPhoto: (sectionId, payload) =>
    request(`/gallery/sections/${sectionId}/photos`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteGalleryPhoto: (id) => request(`/gallery/photos/${id}`, { method: 'DELETE' }),
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
