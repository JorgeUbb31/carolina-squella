const CART_STORAGE_KEY = 'carolina-squella-cart'
const CART_TOKEN_KEY = 'carolina-squella-cart-token'

function createCartToken() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  const bytes = new Uint8Array(16)
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes)
  } else {
    bytes.forEach((_, index) => {
      bytes[index] = Math.floor(Math.random() * 256)
    })
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function getCartToken() {
  let token = localStorage.getItem(CART_TOKEN_KEY)
  if (!token) {
    token = createCartToken()
    localStorage.setItem(CART_TOKEN_KEY, token)
  }
  return token
}

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
