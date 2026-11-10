import { useEffect, useState } from 'react'
import { loadHomeData } from '../services/home.service'

export default function useHomePageData() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    loadHomeData()
      .then((data) => {
        if (!active) return
        setCategories(data.categories)
        setProducts(data.products)
      })
      .catch((loadError) => {
        if (!active) return
        if (import.meta.env.DEV) console.error('No se pudo cargar la tienda:', loadError)
        setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return { categories, products, loading, error }
}
