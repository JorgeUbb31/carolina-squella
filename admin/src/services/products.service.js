import { request } from './api'

export function getProducts(params = {}, options = {}) {
  const query = new URLSearchParams(params)
  return request(`/admin/products?${query.toString()}`, options)
}

export function saveProduct(product, id, imageFile) {
  if (imageFile) {
    const body = new FormData()
    Object.entries(product).forEach(([key, value]) => {
      if (value === undefined) return
      body.append(key, value === null ? '' : typeof value === 'boolean' ? String(Number(value)) : String(value))
    })
    body.append('image', imageFile)
    if (id) body.append('_method', 'PUT')

    return request(id ? `/admin/products/${id}` : '/admin/products', {
      method: 'POST',
      body,
    })
  }

  return request(id ? `/admin/products/${id}` : '/admin/products', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(product),
  })
}

export function deleteProduct(id) {
  return request(`/admin/products/${id}`, { method: 'DELETE' })
}