import { useEffect, useMemo, useState } from 'react'
import { fetchAllProducts, fetchCategories } from '../services/api'

export default function useProductCatalog() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [categorySlug, setCategorySlug] = useState('')
  const [unitType, setUnitType] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    Promise.all([fetchAllProducts(), fetchCategories()])
      .then(([allProducts, allCategories]) => {
        if (!active) return
        setProducts(allProducts)
        setCategories(allCategories)
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
  }, [])

  const visibleProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('es-CL')
    const filteredProducts = products.filter((product) => {
      const matchesSearch = !normalizedSearch
        || [product.name, product.description, product.material, product.color]
          .some((value) => value?.toLocaleLowerCase('es-CL').includes(normalizedSearch))
      const matchesCategory = !categorySlug || product.category?.slug === categorySlug
      const matchesUnit = !unitType || product.unit_type === unitType

      return matchesSearch && matchesCategory && matchesUnit
    })

    if (sortOrder) {
      const direction = sortOrder === 'price-asc' ? 1 : -1
      filteredProducts.sort((first, second) => direction * (Number(first.price) - Number(second.price)))
    }

    return filteredProducts
  }, [products, search, categorySlug, unitType, sortOrder])

  return {
    categories,
    search,
    setSearch,
    categorySlug,
    setCategorySlug,
    unitType,
    setUnitType,
    sortOrder,
    setSortOrder,
    visibleProducts,
    loading,
    error
  }
}
