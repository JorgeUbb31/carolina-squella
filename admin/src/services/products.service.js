import { request } from './api'

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