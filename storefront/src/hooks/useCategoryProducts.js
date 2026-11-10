import { useEffect, useState } from 'react'
import { fetchCategoryProducts } from '../services/api'

export default function useCategoryProducts(slug) {
  const [category, setCategory] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    setLoading(true)
    setError('')
    fetchCategoryProducts(slug)
      .then((data) => {
        if (!active) return
        setCategory(data.category)
        setProducts(data.products ?? [])
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [slug])

  return { category, products, loading, error }
}
