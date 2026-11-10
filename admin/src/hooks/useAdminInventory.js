import { useEffect, useRef, useState } from 'react'
import {
  clearToken,
  getCurrentUser,
  getToken,
  login,
  logout,
} from '../services/api'
import {
  getAdminCategories,
  getCategories,
  deleteCategory,
  saveCategory,
} from '../services/categories.service'
import {
  deleteProduct,
  getProducts,
  saveProduct,
} from '../services/products.service'
import { INVENTORY_PAGE_SIZE, LOW_STOCK_THRESHOLD } from '../config/inventory'
import { formatCurrency } from '../utils/formatters'

function isAbortError(error) {
  return error?.name === 'AbortError'
}

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
  const [adminCategoriesLoading, setAdminCategoriesLoading] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const productRefreshController = useRef(null)
  const categoryRefreshController = useRef(null)

  useEffect(() => {
    return () => {
      productRefreshController.current?.abort()
      categoryRefreshController.current?.abort()
    }
  }, [])

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
    refreshAdminCategories()
  }, [user])

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
    categoryRefreshController.current?.abort()
    const controller = new AbortController()
    categoryRefreshController.current = controller
    setAdminCategoriesLoading(true)
    try {
      setError('')
      const [adminResult, categoryResult] = await Promise.all([
        getAdminCategories({ signal: controller.signal }),
        getCategories({ signal: controller.signal }),
      ])
      setAdminCategories(adminResult)
      setCategories(categoryResult)
    } catch (loadError) {
      if (!isAbortError(loadError)) setError(loadError.message)
    } finally {
      if (categoryRefreshController.current === controller) {
        setAdminCategoriesLoading(false)
      }
    }
  }

  async function refreshProducts({ page: requestedPage = page } = {}) {
    productRefreshController.current?.abort()
    const controller = new AbortController()
    productRefreshController.current = controller
    try {
      const result = await getProducts(getProductParams({
        page: requestedPage,
        search,
        categoryId,
        lowStock,
      }), { signal: controller.signal })
      setProducts(result.data || [])
      setPagination({ current_page: result.current_page, last_page: result.last_page, total: result.total })
    } catch (refreshError) {
      if (!isAbortError(refreshError)) throw refreshError
    }
  }

  async function handleSaveProduct(productData, id) {
    await saveProduct(productData, id)
    setModalOpen(false)
    setEditingProduct(null)
    setNotice(id ? 'Producto actualizado.' : 'Producto creado correctamente.')
    setError('')
    if (page === 1) {
      try {
        await refreshProducts({ page: 1 })
      } catch (refreshError) {
        setError(`Producto guardado, pero no se pudo actualizar la lista: ${refreshError.message}`)
      }
    } else {
      setPage(1)
    }
  }

  async function handleSaveCategory(categoryData, id) {
    await saveCategory(categoryData, id)
    setCategoryModalOpen(false)
    setEditingCategory(null)
    setNotice(id ? 'Categoría actualizada.' : 'Categoría creada correctamente.')
    await refreshAdminCategories()
  }

  function requestDeleteCategory(category) {
    setDeleteConfirmation({
      type: 'category',
      item: category,
      title: 'Eliminar categoría',
      message: `¿Eliminar “${category.name}”?`,
    })
  }

  function requestDeleteProduct(product) {
    setDeleteConfirmation({
      type: 'product',
      item: product,
      title: 'Eliminar producto',
      message: `¿Eliminar “${product.name}”? Esta acción no se puede deshacer.`,
    })
  }

  async function handleConfirmDelete() {
    if (!deleteConfirmation || deleteBusy) return
    setDeleteBusy(true)
    setError('')
    try {
      if (deleteConfirmation.type === 'category') {
        await deleteCategory(deleteConfirmation.item.id)
        setNotice('Categoría eliminada.')
        setDeleteConfirmation(null)
        await refreshAdminCategories()
      } else {
        await deleteProduct(deleteConfirmation.item.id)
        setNotice('Producto eliminado.')
        setDeleteConfirmation(null)
        if (products.length === 1 && page > 1) {
          setPage((current) => current - 1)
        } else {
          try {
            await refreshProducts()
          } catch (refreshError) {
            setError(`Producto eliminado, pero no se pudo actualizar la lista: ${refreshError.message}`)
          }
        }
      }
    } catch (deleteError) {
      if (!isAbortError(deleteError)) setError(deleteError.message)
    } finally {
      setDeleteBusy(false)
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
    adminCategoriesLoading,
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
    onDeleteProduct: requestDeleteProduct,
    page,
    onEditCategory: openCategoryModal,
    onDeleteCategory: requestDeleteCategory,
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
    deleteConfirmation,
    deleteBusy,
    handleConfirmDelete,
    closeDeleteConfirmation: () => {
      if (!deleteBusy) setDeleteConfirmation(null)
    },
  }
}
