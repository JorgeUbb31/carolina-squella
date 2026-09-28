const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  })
  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    throw new Error('El backend no devolvió JSON. Verifica que Laravel esté activo en el puerto 8000.')
  }

  const payload = await response.json()
  if (!response.ok) {
    const validationMessage = Object.values(payload.errors || {}).flat()[0]
    throw new Error(validationMessage || payload.message || `Error del servidor: ${response.status}`)
  }

  return Array.isArray(payload) ? payload : (payload.data ?? payload)
}

export const fetchCategories = () => request('/categories')
export const fetchCategoryProducts = (slug) => request(`/categories/${slug}/products`)
export const fetchProducts = () => request('/products')
export const fetchProduct = (slug) => request(`/products/${slug}`)
export const fetchCart = (token) => request(`/cart?cart_token=${encodeURIComponent(token)}`)
export const saveRemoteCart = (token, items) => request('/cart', {
  method: 'PUT',
  body: JSON.stringify({
    cart_token: token,
    items: items.map(({ slug, quantity }) => ({ slug, quantity }))
  })
})
export const clearRemoteCart = (token) => request('/cart', {
  method: 'DELETE',
  body: JSON.stringify({ cart_token: token })
})
export const submitOrder = (order) => request('/orders', {
  method: 'POST',
  body: JSON.stringify(order)
})
