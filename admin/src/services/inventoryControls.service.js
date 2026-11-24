import { API_URL } from '../config/api'
import { getToken, request } from './api'

export function getInventoryControls(params = {}, options = {}) {
  const query = new URLSearchParams(params)
  return request(`/admin/inventory-controls?${query.toString()}`, options)
}

export function getInventoryControl(id, options = {}) {
  return request(`/admin/inventory-controls/${id}`, options)
}

export function createInventoryControl() {
  return request('/admin/inventory-controls', { method: 'POST' })
}

export function saveInventoryControlCount(controlId, itemId, data) {
  return request(`/admin/inventory-controls/${controlId}/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function completeInventoryControl(id) {
  return request(`/admin/inventory-controls/${id}/complete`, { method: 'POST' })
}

export async function getInventoryControlReport(id) {
  const token = getToken()
  const response = await fetch(`${API_URL}/admin/inventory-controls/${id}/report`, {
    headers: {
      Accept: 'application/pdf',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.message || `Error ${response.status}`)
  }

  return response.blob()
}
