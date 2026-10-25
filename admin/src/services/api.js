const API_URL = import.meta.env.VITE_API_URL || '/api/v1'
const TOKEN_KEY = 'carolina-admin-token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request(path, options = {}) {
  const token = getToken()
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 204) return null

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401) clearToken()
    const validationMessage = payload.errors
      ? Object.values(payload.errors).flat().join(' ')
      : ''
    throw new Error(validationMessage || payload.message || `Error ${response.status}`)
  }

  return payload
}

export async function login(email, password) {
  const payload = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  localStorage.setItem(TOKEN_KEY, payload.token)
  return payload.user
}

export function logout() {
  return request('/auth/logout', { method: 'POST' }).finally(clearToken)
}

export function getCurrentUser() {
  return request('/auth/me')
}

export function getCategories() {
  return request('/categories')
}

export function getProducts(params = {}) {
  const query = new URLSearchParams(params)
  return request(`/admin/products?${query.toString()}`)
}

export function saveProduct(product, id) {
  return request(id ? `/admin/products/${id}` : '/admin/products', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(product),
  })
}

export function deleteProduct(id) {
  return request(`/admin/products/${id}`, { method: 'DELETE' })
}