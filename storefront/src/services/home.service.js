import { fetchCategories, fetchProducts } from './api'

export async function loadHomeData() {
  const [categories, products] = await Promise.all([
    fetchCategories(),
    fetchProducts()
  ])

  return {
    categories,
    products,
    heroProduct: products[0] ?? null
  }
}

export function formatPrice(value) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(Number(value ?? 0))
}
