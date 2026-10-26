import { API_TOKEN_KEY, API_URL } from '../config/api'

export function getToken() {
  return localStorage.getItem(API_TOKEN_KEY)
}

export function clearToken() {
  localStorage.removeItem(API_TOKEN_KEY)
}

export async function request(path, options = {}) {
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
  localStorage.setItem(API_TOKEN_KEY, payload.token)
  return payload.user
}

export function logout() {
  return request('/auth/logout', { method: 'POST' }).finally(clearToken)
}

export function getCurrentUser() {
  return request('/auth/me')
}
