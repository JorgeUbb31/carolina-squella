const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

async function request(path) {
  const response = await fetch(`${API_URL}${path}`)

  if (!response.ok) {
    throw new Error(`Error cargando datos: ${response.status}`)
  }

  const payload = await response.json()
  return Array.isArray(payload) ? payload : (payload.data ?? [])
}

export const fetchCategories = () => request('/categories')
export const fetchProducts = () => request('/products')
