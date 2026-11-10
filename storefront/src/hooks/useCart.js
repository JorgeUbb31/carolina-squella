import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  addItem,
  clearCart,
  getCartItemCount,
  getCartToken,
  readCart,
  removeItem,
  saveCart,
  updateItemQuantity
} from '../services/cart.service'
import { clearRemoteCart, fetchCart, saveRemoteCart } from '../services/api'

export default function useCart() {
  const location = useLocation()
  const isPaymentReturn = location.pathname === '/payment/result'
  const [items, setItems] = useState(readCart)
  const [error, setError] = useState('')
  const [token] = useState(getCartToken)
  const hydrated = useRef(false)
  const saveTimer = useRef(null)

  const clear = useCallback(() => {
    hydrated.current = true
    window.clearTimeout(saveTimer.current)
    setItems(clearCart())
    setError('')
    clearRemoteCart(token).catch((requestError) => setError(requestError.message))
  }, [token])

  useEffect(() => {
    let active = true

    fetchCart(token)
      .then(async ({ items: remoteItems }) => {
        if (!active || hydrated.current) return

        if (remoteItems?.length) {
          setItems(saveCart(remoteItems))
          return
        }

        if (isPaymentReturn) {
          setItems(saveCart([]))
          return
        }

        const legacyItems = readCart()
        if (legacyItems.length) {
          const savedCart = await saveRemoteCart(token, legacyItems)
          if (!active || hydrated.current) return
          setItems(saveCart(savedCart.items ?? legacyItems))
          return
        }

        setItems(saveCart([]))
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) hydrated.current = true
      })

    return () => {
      active = false
    }
  }, [isPaymentReturn, token])

  useEffect(() => () => window.clearTimeout(saveTimer.current), [])

  const persist = useCallback((nextItems) => {
    hydrated.current = true
    setItems(saveCart(nextItems))
    setError('')
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      saveRemoteCart(token, nextItems).catch((requestError) => setError(requestError.message))
    }, 400)
  }, [token])

  const add = useCallback((product) => {
    persist(addItem(items, product))
  }, [items, persist])

  const updateQuantity = useCallback((slug, quantity) => {
    persist(updateItemQuantity(items, slug, quantity))
  }, [items, persist])

  const remove = useCallback((slug) => {
    persist(removeItem(items, slug))
  }, [items, persist])

  return {
    items,
    error,
    token,
    count: getCartItemCount(items),
    add,
    updateQuantity,
    remove,
    clear
  }
}
