import { useEffect, useState } from 'react'
import { fetchProduct } from '../services/api'

export default function useProductDetails(slug) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    fetchProduct(slug)
      .then((data) => {
        if (active) setProduct(data)
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

  return { product, loading, error }
}
