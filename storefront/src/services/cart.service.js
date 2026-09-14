const CART_STORAGE_KEY = 'carolina-squella-cart'

function isCartItem(item) {
  return item && typeof item.slug === 'string' && item.slug.length > 0 && Number(item.quantity) > 0
}

export function readCart() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]')
    return Array.isArray(items)
      ? items.filter(isCartItem).map((item) => ({ ...item, quantity: Number(item.quantity) }))
      : []
  } catch {
    return []
  }
}

export function saveCart(items) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  return items
}

export function addItem(items, product) {
  const existingItem = items.find((item) => item.slug === product.slug)

  return existingItem
    ? items.map((item) => item.slug === product.slug
      ? { ...item, quantity: item.quantity + 1 }
      : item)
    : [...items, { ...product, quantity: 1 }]
}

export function updateItemQuantity(items, slug, quantity) {
  return quantity > 0
    ? items.map((item) => item.slug === slug ? { ...item, quantity } : item)
    : items.filter((item) => item.slug !== slug)
}

export function removeItem(items, slug) {
  return items.filter((item) => item.slug !== slug)
}

export function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY)
  return []
}

export function getCartItemCount(items) {
  return items.reduce((total, item) => total + item.quantity, 0)
}
