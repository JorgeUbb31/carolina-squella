import { request } from './api'

export function getCategories(options = {}) {
  return request('/categories', options)
}

export function getAdminCategories(options = {}) {
  return request('/admin/categories', options)
}

export function saveCategory(category, id) {
  return request(id ? `/admin/categories/${id}` : '/admin/categories', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(category),
  })
}

export function deleteCategory(id) {
  return request(`/admin/categories/${id}`, { method: 'DELETE' })
}