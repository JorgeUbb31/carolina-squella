import { request } from './api'

export function getCategories() {
  return request('/categories')
}

export function getAdminCategories() {
  return request('/admin/categories')
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