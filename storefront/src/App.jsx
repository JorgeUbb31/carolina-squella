import { useRef } from 'react'
import { Link, Routes, Route, useLocation } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import CategoryPage from './pages/CategoryPage'
import PaymentResultPage from './pages/PaymentResultPage'
import ProductCatalogPage from './pages/ProductCatalogPage'
import useCart from './hooks/useCart'

export default function App() {
  const location = useLocation()
  const isPaymentReturn = useRef(location.pathname === '/payment/result')
  const cart = useCart(isPaymentReturn.current)

  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/">Carolina Squella</Link>
        <Link className="cart-link" to="/cart">Carrito ({cart.count})</Link>
      </header>
      <Routes>
        <Route path="/" element={<HomePage onAddToCart={cart.add} />} />
        <Route path="/categories/:slug" element={<CategoryPage onAddToCart={cart.add} />} />
        <Route path="/products" element={<ProductCatalogPage onAddToCart={cart.add} />} />
        <Route path="/products/:slug" element={<ProductPage onAddToCart={cart.add} />} />
        <Route path="/payment/result" element={<PaymentResultPage cartError={cart.error} onPaymentApproved={cart.clear} />} />
        <Route path="/cart" element={<CartPage cartItems={cart.items} cartToken={cart.token} cartError={cart.error} onUpdateQuantity={cart.updateQuantity} onRemove={cart.remove} onClear={cart.clear} />} />
      </Routes>
    </>
  )
}
