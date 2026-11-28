import { getToken, request } from './api'
import { API_URL } from '../config/api'

export function getSales(params = {}, options = {}) {
  const query = new URLSearchParams(params)
  return request(`/admin/orders?${query.toString()}`, options)
}

export function createInPersonSale(sale) {
  return request('/admin/orders', {
    method: 'POST',
    body: JSON.stringify(sale),
  })
}

export function getCustomerByRut(rut) {
  const query = new URLSearchParams({ rut })
  return request(`/admin/orders/customer?${query.toString()}`)
}

export function updateInPersonSale(id, sale) {
  return request(`/admin/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(sale),
  })
}

export async function getMonthlySalesReport(month) {
  const query = new URLSearchParams({ month })
  const token = getToken()
  const response = await fetch(`${API_URL}/admin/orders/monthly-report?${query.toString()}`, {
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
