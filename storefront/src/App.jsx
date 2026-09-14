import { useState } from 'react'
import { Link, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'

function readCart() {
  try {
    return JSON.parse(localStorage.getItem('carolina-squella-cart') || '[]')
  } catch {
    return []
  }
}

export default function App() {
  const [cartItems, setCartItems] = useState(readCart)

  const persistCart = (items) => {
    setCartItems(items)
    localStorage.setItem('carolina-squella-cart', JSON.stringify(items))
  }

  const addToCart = (product) => {
    const existingItem = cartItems.find((item) => item.slug === product.slug)
    const items = existingItem
      ? cartItems.map((item) => item.slug === product.slug ? { ...item, quantity: item.quantity + 1 } : item)
      : [...cartItems, { ...product, quantity: 1 }]

    persistCart(items)
  }

  const updateQuantity = (slug, quantity) => {
    persistCart(quantity > 0
      ? cartItems.map((item) => item.slug === slug ? { ...item, quantity } : item)
      : cartItems.filter((item) => item.slug !== slug))
  }

  const removeFromCart = (slug) => {
    persistCart(cartItems.filter((item) => item.slug !== slug))
  }

  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/">Carolina Squella</Link>
        <Link className="cart-link" to="/cart">Carrito ({cartItems.reduce((total, item) => total + item.quantity, 0)})</Link>
      </header>
      <Routes>
        <Route path="/" element={<HomePage onAddToCart={addToCart} />} />
        <Route path="/products/:slug" element={<ProductPage onAddToCart={addToCart} />} />
        <Route path="/cart" element={<CartPage cartItems={cartItems} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} />} />
      </Routes>
    </>
  )
}
