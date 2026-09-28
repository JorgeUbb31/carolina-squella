import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../services/home.service'
import { submitOrder } from '../services/api'

const initialForm = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  delivery_address: '',
  delivery_city: '',
  delivery_region: '',
  payment_method: 'bank_transfer'
}

export default function CartPage({ cartItems, cartToken, cartError, onUpdateQuantity, onRemove, onClear }) {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [completedOrder, setCompletedOrder] = useState(null)
  const total = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setCheckoutError('')

    try {
      const result = await submitOrder({ ...form, cart_token: cartToken })
      setCompletedOrder(result.order)
      onClear()
    } catch (error) {
      setCheckoutError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="cart-page container page-enter">
      <div className="section-title">
        <h1>Tu carrito</h1>
        <Link className="secondary-btn" to="/">Seguir comprando</Link>
      </div>
      {completedOrder && (
        <section className="order-confirmation" role="status">
          <span className="eyebrow">Pedido registrado</span>
          <h2>Gracias por tu compra</h2>
          <p>Tu número de pedido es <strong>{completedOrder.order_number}</strong>. Te contactaremos para coordinar el pago por transferencia y confirmar el despacho.</p>
          <Link className="secondary-btn" to="/">Volver a la tienda</Link>
        </section>
      )}
      {cartItems.length === 0 ? (
        !completedOrder && <div className="page-state">
          <p>Tu carrito está vacío.</p>
          <Link className="primary-btn" to="/">Ver productos</Link>
        </div>
      ) : !completedOrder && (
        <div className="cart-layout">
          <section className="cart-items">
            {cartError && <p className="form-error" role="alert">{cartError}</p>}
            <button className="primary-btn" onClick={onClear}>Vaciar carrito</button>
            {cartItems.map((item) => (
              <article className="cart-item" key={item.slug}>
                <img src={item.image_url} alt={item.name} />
                <div>
                  <h2>{item.name}</h2>
                  <p>{formatPrice(item.price)} por {item.unit_type || 'pieza'}</p>
                  <div className="quantity-controls">
                    <button aria-label={`Disminuir cantidad de ${item.name}`} onClick={() => onUpdateQuantity(item.slug, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button aria-label={`Aumentar cantidad de ${item.name}`} disabled={item.quantity >= item.stock} onClick={() => onUpdateQuantity(item.slug, item.quantity + 1)}>+</button>
                    <button className="remove-btn" onClick={() => onRemove(item.slug)}>Eliminar</button>
                  </div>
                </div>
                <strong>{formatPrice(Number(item.price) * item.quantity)}</strong>
              </article>
            ))}
          </section>
          <aside className="cart-summary">
            <h2>Datos de entrega</h2>
            <div className="summary-total"><span>Subtotal</span><strong>{formatPrice(total)}</strong></div>
            <p>El despacho se cotiza y confirma contigo antes del pago.</p>
            <form className="checkout-form" onSubmit={handleSubmit}>
              <label>Nombre completo<input required maxLength="160" autoComplete="name" value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} /></label>
              <label>Correo electrónico<input required type="email" maxLength="255" autoComplete="email" value={form.customer_email} onChange={(event) => setForm({ ...form, customer_email: event.target.value })} /></label>
              <label>Teléfono<input required type="tel" maxLength="40" autoComplete="tel" value={form.customer_phone} onChange={(event) => setForm({ ...form, customer_phone: event.target.value })} /></label>
              <label>Dirección<input required maxLength="255" autoComplete="street-address" value={form.delivery_address} onChange={(event) => setForm({ ...form, delivery_address: event.target.value })} /></label>
              <div className="form-row">
                <label>Comuna<input required maxLength="120" autoComplete="address-level2" value={form.delivery_city} onChange={(event) => setForm({ ...form, delivery_city: event.target.value })} /></label>
                <label>Región<input required maxLength="120" autoComplete="address-level1" value={form.delivery_region} onChange={(event) => setForm({ ...form, delivery_region: event.target.value })} /></label>
              </div>
              {checkoutError && <p className="form-error" role="alert">{checkoutError}</p>}
              <button className="primary-btn checkout-submit" type="submit" disabled={submitting || Boolean(cartError)}>
                {submitting ? 'Registrando pedido...' : 'Confirmar pedido'}
              </button>
              <small>El pedido queda pendiente de pago. No se realizará ningún cobro en línea.</small>
            </form>
          </aside>
        </div>
      )}
    </main>
  )
}
