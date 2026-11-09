import { useCallback, useEffect, useState } from 'react'
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

export default function useCart(isPaymentReturn) {
  const [items, setItems] = useState(readCart)
  const [error, setError] = useState('')
  const [token] = useState(getCartToken)

  const clear = useCallback(() => {
    setItems(clearCart())
    setError('')
    clearRemoteCart(token).catch((requestError) => setError(requestError.message))
  }, [token])

  useEffect(() => {
    fetchCart(token)
      .then(async ({ items: remoteItems }) => {
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
          setItems(saveCart(savedCart.items ?? legacyItems))
          return
        }

        setItems(saveCart([]))
      })
      .catch((requestError) => setError(requestError.message))
  }, [isPaymentReturn, token])

  const persist = useCallback((nextItems) => {
    setItems(saveCart(nextItems))
    setError('')
    saveRemoteCart(token, nextItems).catch((requestError) => setError(requestError.message))
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
