import { request } from './api'

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
