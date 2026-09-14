const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

async function request(path) {
  const response = await fetch(`${API_URL}${path}`)

  if (!response.ok) {
    throw new Error(`Error cargando datos: ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    throw new Error('El backend no devolvió JSON. Verifica que Laravel esté activo en el puerto 8000.')
  }

  const payload = await response.json()
  return Array.isArray(payload) ? payload : (payload.data ?? payload)
}

export const fetchCategories = () => request('/categories')
export const fetchProducts = () => request('/products')
export const fetchProduct = (slug) => request(`/products/${slug}`)
