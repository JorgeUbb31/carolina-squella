import { Component } from 'react'
import { AlertTriangle, LoaderCircle } from 'lucide-react'
import CategoryModal from './components/CategoryModal'
import ConfirmationModal from './components/ConfirmationModal'
import ProductModal from './components/ProductModal'
import useAdminInventory from './hooks/useAdminInventory'
import InventoryPage from './pages/InventoryPage'
import LoginPage from './pages/LoginPage'

function AppContent() {
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
      {inventory.deleteConfirmation && (
        <ConfirmationModal
          title={inventory.deleteConfirmation.title}
          message={inventory.deleteConfirmation.message}
          busy={inventory.deleteBusy}
          onCancel={inventory.closeDeleteConfirmation}
          onConfirm={inventory.handleConfirmDelete}
        />
      )}
    </>
  )
}

class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="loading-screen" role="alert">
          <AlertTriangle size={22} />
          <span>Algo falló.</span>
          <button className="button button-primary" type="button" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </main>
      )
    }

    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}
