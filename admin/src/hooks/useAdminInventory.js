import { useEffect, useState } from 'react'
import {
  clearToken,
  getCurrentUser,
  getToken,
  login,
  logout,
} from '../services/api'
import {
  deleteCategory,
  getAdminCategories,
  getCategories,
  saveCategory,
} from '../services/categories.service'
import {
  deleteProduct,
  getProducts,
  saveProduct,
} from '../services/products.service'
import { INVENTORY_PAGE_SIZE, LOW_STOCK_THRESHOLD } from '../config/inventory'
import { formatCurrency } from '../utils/formatters'

function getProductParams({ page, search, categoryId, lowStock }) {
  const params = { per_page: String(INVENTORY_PAGE_SIZE), page: String(page) }
  if (search.trim()) params.search = search.trim()
  if (categoryId) params.category_id = categoryId
  if (lowStock) params.low_stock_below = String(LOW_STOCK_THRESHOLD)
  return params
}

export default function useAdminInventory() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [lowStock, setLowStock] = useState(false)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('products')
  const [adminCategories, setAdminCategories] = useState([])
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)

  useEffect(() => {
    if (!getToken()) {
      setAuthReady(true)
      return
    }
    getCurrentUser()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setAuthReady(true))
  }, [])

  useEffect(() => {
    if (!user) return
    getCategories().then(setCategories).catch((loadError) => setError(loadError.message))
  }, [user])

  useEffect(() => {
    if (!user || activeSection !== 'categories') return
    refreshAdminCategories()
  }, [user, activeSection])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setError('')
    getProducts(getProductParams({ page, search, categoryId, lowStock }))
      .then((result) => {
        if (cancelled) return
        setProducts(result.data || [])
        setPagination({ current_page: result.current_page, last_page: result.last_page, total: result.total })
      })
      .catch((loadError) => {
        if (cancelled) return
        setError(loadError.message)
        if (!getToken()) setUser(null)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user, page, search, categoryId, lowStock])

  async function handleLogin(email, password) {
    const loggedInUser = await login(email, password)
    setUser(loggedInUser)
  }

  async function handleLogout() {
    try { await logout() } catch { clearToken() }
    setUser(null)
    setProducts([])
  }

  async function refreshAdminCategories() {
    try {
      setError('')
      setAdminCategories(await getAdminCategories())
    } catch (loadError) {
      setError(loadError.message)
    }
  }

  async function refreshProducts() {
    const result = await getProducts(getProductParams({ page, search, categoryId, lowStock }))
    setProducts(result.data || [])
    setPagination({ current_page: result.current_page, last_page: result.last_page, total: result.total })
  }

  async function handleSaveProduct(productData, id) {
    await saveProduct(productData, id)
    setModalOpen(false)
    setEditingProduct(null)
    setNotice(id ? 'Producto actualizado.' : 'Producto creado correctamente.')
    setPage(1)
    await refreshProducts()
  }

  async function handleSaveCategory(categoryData, id) {
    await saveCategory(categoryData, id)
    setCategoryModalOpen(false)
    setEditingCategory(null)
    setNotice(id ? 'Categoría actualizada.' : 'Categoría creada correctamente.')
    await refreshAdminCategories()
    setCategories(await getCategories())
  }

  async function handleDeleteCategory(category) {
    if (!window.confirm(`¿Eliminar “${category.name}”?`)) return
    try {
      await deleteCategory(category.id)
      setNotice('Categoría eliminada.')
      await refreshAdminCategories()
      setCategories(await getCategories())
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  async function handleDeleteProduct(product) {
    if (!window.confirm(`¿Eliminar “${product.name}”? Esta acción no se puede deshacer.`)) return
    try {
      await deleteProduct(product.id)
      setNotice('Producto eliminado.')
      await refreshProducts()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  function openProductModal(product = null) {
    setEditingProduct(product)
    setModalOpen(true)
  }

  function closeProductModal() {
    setModalOpen(false)
    setEditingProduct(null)
  }

  function openCategoryModal(category = null) {
    setEditingCategory(category)
    setCategoryModalOpen(true)
  }

  function closeCategoryModal() {
    setCategoryModalOpen(false)
    setEditingCategory(null)
  }

  const inventoryPageProps = {
    user,
    onLogout: handleLogout,
    activeSection,
    setActiveSection,
    pagination,
    adminCategories,
    onCreateProduct: () => openProductModal(),
    onCreateCategory: () => openCategoryModal(),
    lowStock,
    setLowStock,
    setPage,
    search,
    setSearch,
    categoryId,
    setCategoryId,
    categories,
    error,
    setError,
    notice,
    setNotice,
    loading,
    products,
    money: formatCurrency,
    onEditProduct: openProductModal,
    onDeleteProduct: handleDeleteProduct,
    page,
    onEditCategory: openCategoryModal,
    onDeleteCategory: handleDeleteCategory,
  }

  return {
    authReady,
    user,
    handleLogin,
    inventoryPageProps,
    modalOpen,
    editingProduct,
    categories,
    closeProductModal,
    handleSaveProduct,
    categoryModalOpen,
    editingCategory,
    closeCategoryModal,
    handleSaveCategory,
  }
}
