import { LoaderCircle } from 'lucide-react'
import CategoryModal from './components/CategoryModal'
import ProductModal from './components/ProductModal'
import useAdminInventory from './hooks/useAdminInventory'
import InventoryPage from './pages/InventoryPage'
import LoginPage from './pages/LoginPage'

export default function App() {
  const inventory = useAdminInventory()

  if (!inventory.authReady) {
    return <main className="loading-screen"><LoaderCircle className="spin" size={28} /><span>Preparando inventario…</span></main>
  }

  if (!inventory.user) return <LoginPage onLogin={inventory.handleLogin} />

  return (
    <>
      <InventoryPage {...inventory.inventoryPageProps} />
      {inventory.modalOpen && (
        <ProductModal
          product={inventory.editingProduct}
          categories={inventory.categories}
          onClose={inventory.closeProductModal}
          onSave={inventory.handleSaveProduct}
        />
      )}
      {inventory.categoryModalOpen && (
        <CategoryModal
          category={inventory.editingCategory}
          onClose={inventory.closeCategoryModal}
          onSave={inventory.handleSaveCategory}
        />
      )}
    </>
  )
}
