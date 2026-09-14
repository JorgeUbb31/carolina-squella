import { useState } from 'react'
import { Link, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import {
  addItem,
  clearCart,
  getCartItemCount,
  readCart,
  removeItem,
  saveCart,
  updateItemQuantity
} from './services/cart.service'

export default function App() {
  const [cartItems, setCartItems] = useState(readCart)

  const persistCart = (items) => {
    setCartItems(saveCart(items))
  }

  const addToCart = (product) => {
    persistCart(addItem(cartItems, product))
  }

  const updateQuantity = (slug, quantity) => {
    persistCart(updateItemQuantity(cartItems, slug, quantity))
  }

  const removeFromCart = (slug) => {
    persistCart(removeItem(cartItems, slug))
  }

  const emptyCart = () => {
    setCartItems(clearCart())
  }

  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/">Carolina Squella</Link>
        <Link className="cart-link" to="/cart">Carrito ({getCartItemCount(cartItems)})</Link>
      </header>
      <Routes>
        <Route path="/" element={<HomePage onAddToCart={addToCart} />} />
        <Route path="/products/:slug" element={<ProductPage onAddToCart={addToCart} />} />
        <Route path="/cart" element={<CartPage cartItems={cartItems} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} onClear={emptyCart} />} />
      </Routes>
    </>
  )
}
