const BASE = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'interncloud_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

/** /uploads/... -> absolute URL (works with the dev proxy and in production) */
export const assetUrl = (p) => (!p ? '' : /^(https?:|data:)/.test(p) ? p : BASE + p)

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (form) payload = form // browser sets the multipart boundary itself
  else if (body) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(`${BASE}/api${path}`, { method, headers, body: payload })
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.')
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    // token expired / revoked -> let AuthContext sign the user out
    if (res.status === 401 && token) window.dispatchEvent(new Event('auth:expired'))
    const err = new Error(data.message || 'Request failed')
    err.status = res.status
    err.code = data.code
    throw err
  }
  return data
}

export const api = {
  get: (p) => request(p),
  post: (p, opts) => request(p, { method: 'POST', ...opts }),
  put: (p, opts) => request(p, { method: 'PUT', ...opts }),
}
