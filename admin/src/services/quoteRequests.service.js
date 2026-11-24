import { request } from './api'

export function getQuoteRequests(params = {}, options = {}) {
  const query = new URLSearchParams(params)
  return request(`/admin/quote-requests?${query.toString()}`, options)
}

export function updateQuoteRequestStatus(id, status) {
  return request(`/admin/quote-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
