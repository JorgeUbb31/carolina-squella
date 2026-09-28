import { useEffect, useState } from 'react'
import { Link, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ProductPage from './pages/ProductPage'
import CartPage from './pages/CartPage'
import CategoryPage from './pages/CategoryPage'
import {
  addItem,
  clearCart,
  getCartItemCount,
  getCartToken,
  readCart,
  removeItem,
  saveCart,
  updateItemQuantity
} from './services/cart.service'
import { clearRemoteCart, fetchCart, saveRemoteCart } from './services/api'

export default function App() {
  const [cartItems, setCartItems] = useState(readCart)
  const [cartError, setCartError] = useState('')
  const cartToken = getCartToken()

  useEffect(() => {
    fetchCart(cartToken)
      .then(async ({ items }) => {
        if (items?.length) {
          setCartItems(saveCart(items))
          return
        }

        const legacyItems = readCart()
        if (legacyItems.length) {
          const savedCart = await saveRemoteCart(cartToken, legacyItems)
          setCartItems(saveCart(savedCart.items ?? legacyItems))
          return
        }

        setCartItems(saveCart([]))
      })
      .catch((error) => setCartError(error.message))
  }, [cartToken])

  const persistCart = (items) => {
    setCartItems(saveCart(items))
    setCartError('')
    saveRemoteCart(cartToken, items).catch((error) => setCartError(error.message))
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
    setCartError('')
    clearRemoteCart(cartToken).catch((error) => setCartError(error.message))
  }

  return (
    <>
      <header className="site-header">
        <Link className="brand" to="/">Carolina Squella</Link>
        <Link className="cart-link" to="/cart">Carrito ({getCartItemCount(cartItems)})</Link>
      </header>
      <Routes>
        <Route path="/" element={<HomePage onAddToCart={addToCart} />} />
        <Route path="/categories/:slug" element={<CategoryPage onAddToCart={addToCart} />} />
        <Route path="/products/:slug" element={<ProductPage onAddToCart={addToCart} />} />
        <Route path="/cart" element={<CartPage cartItems={cartItems} cartToken={cartToken} cartError={cartError} onCheckoutComplete={emptyCart} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} onClear={emptyCart} />} />
      </Routes>
    </>
  )
}
