import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../services/home.service'
import { submitOrder } from '../services/api'
import ShippingNotice from '../components/ShippingNotice'
import { formatProductQuantity, formatRollWidth, getProductUnitLabel } from '../utils/productFormatters'
import { CHILE_REGIONS } from '../data/chileLocations'

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
  const [showShippingNotice, setShowShippingNotice] = useState(false)
  const [step, setStep] = useState('cart')
  const selectedRegion = CHILE_REGIONS.find((region) => region.name === form.delivery_region)
  const total = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

  const handleSubmit = (event) => {
    event.preventDefault()
    setCheckoutError('')
    setShowShippingNotice(true)
  }

  const confirmOrder = async () => {
    setShowShippingNotice(false)
    setSubmitting(true)
    setCheckoutError('')

    try {
      const result = await submitOrder({ ...form, cart_token: cartToken })
      if (result.payment) {
        const paymentForm = document.createElement('form')
        paymentForm.method = 'POST'
        paymentForm.action = result.payment.url

        const tokenInput = document.createElement('input')
        tokenInput.type = 'hidden'
        tokenInput.name = 'token_ws'
        tokenInput.value = result.payment.token

        paymentForm.appendChild(tokenInput)
        document.body.appendChild(paymentForm)
        paymentForm.submit()
        return
      }

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
        step === 'cart' ? (
          <div className="cart-layout">
            <section className="cart-items">
              {cartError && <p className="form-error" role="alert">{cartError}</p>}
              <button className="primary-btn" onClick={onClear}>Vaciar carrito</button>
              {cartItems.map((item) => (
                <article className="cart-item" key={item.slug}>
                  <img src={item.image_url} alt={item.name} />
                  <div>
                    <h2>{item.name}</h2>
                    <p>{formatPrice(item.price)} por {getProductUnitLabel(item.unit_type)}</p>
                    {item.unit_type === 'metro' && item.width_cm && (
                      <p className="product-width">Ancho del rollo: {formatRollWidth(item.width_cm)}</p>
                    )}
                    <div className="quantity-controls">
                      <button aria-label={`Disminuir cantidad de ${item.name}`} onClick={() => onUpdateQuantity(item.slug, item.quantity - 1)}>-</button>
                      <span>{formatProductQuantity(item.quantity, item.unit_type)}</span>
                      <button aria-label={`Aumentar cantidad de ${item.name}`} disabled={item.quantity >= item.stock} onClick={() => onUpdateQuantity(item.slug, item.quantity + 1)}>+</button>
                      <button className="remove-btn" onClick={() => onRemove(item.slug)}>Eliminar</button>
                    </div>
                  </div>
                  <strong>{formatPrice(Number(item.price) * item.quantity)}</strong>
                </article>
              ))}
            </section>
            <aside className="cart-summary">
              <h2>Resumen de compra</h2>
              <div className="summary-total"><span>Subtotal</span><strong>{formatPrice(total)}</strong></div>
              <p>El despacho se cotiza y confirma contigo antes del pago.</p>
              <button className="primary-btn checkout-submit" type="button" disabled={Boolean(cartError)} onClick={() => setStep('checkout')}>
                Continuar con la compra
              </button>
            </aside>
          </div>
        ) : (
          <div className="cart-layout checkout-layout">
            <section className="cart-summary checkout-details">
              <button className="secondary-btn checkout-back" type="button" onClick={() => setStep('cart')}>Volver al carrito</button>
              <h2>Datos de entrega</h2>
              <p>Ingresa tus datos para preparar el pedido. El costo del despacho se cotiza contigo.</p>
              <form className="checkout-form" onSubmit={handleSubmit}>
                <fieldset className="payment-options">
                  <legend>Método de pago</legend>
                  <label>
                    <input
                      type="radio"
                      name="payment_method"
                      value="webpay_plus"
                      checked={form.payment_method === 'webpay_plus'}
                      onChange={(event) => setForm({ ...form, payment_method: event.target.value })}
                    />
                    Webpay Plus
                    <small>Tarjetas y otros medios disponibles en Transbank. Autorizarás el pago en su sitio seguro.</small>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="payment_method"
                      value="bank_transfer"
                      checked={form.payment_method === 'bank_transfer'}
                      onChange={(event) => setForm({ ...form, payment_method: event.target.value })}
                    />
                    Transferencia bancaria
                    <small>Te contactaremos para coordinar el pago después de registrar el pedido.</small>
                  </label>
                </fieldset>
                <label>Nombre completo<input required maxLength="160" autoComplete="name" value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} /></label>
                <label>Correo electrónico<input required type="email" maxLength="255" autoComplete="email" value={form.customer_email} onChange={(event) => setForm({ ...form, customer_email: event.target.value })} /></label>
                <label>Teléfono<input required type="tel" maxLength="40" autoComplete="tel" value={form.customer_phone} onChange={(event) => setForm({ ...form, customer_phone: event.target.value })} /></label>
                <label>Dirección<input required maxLength="255" autoComplete="street-address" value={form.delivery_address} onChange={(event) => setForm({ ...form, delivery_address: event.target.value })} /></label>
                <div className="form-row">
                  <label>Región
                    <select
                      name="delivery_region"
                      autoComplete="address-level1"
                      required
                      value={form.delivery_region}
                      onChange={(event) => setForm({ ...form, delivery_region: event.target.value, delivery_city: '' })}
                    >
                      <option value="">Selecciona una región</option>
                      {CHILE_REGIONS.map((region) => <option key={region.name} value={region.name}>{region.name}</option>)}
                    </select>
                  </label>
                  <label>Comuna
                    <select
                      name="delivery_city"
                      autoComplete="address-level2"
                      required
                      disabled={!selectedRegion}
                      value={form.delivery_city}
                      onChange={(event) => setForm({ ...form, delivery_city: event.target.value })}
                    >
                      <option value="">{selectedRegion ? 'Selecciona una comuna' : 'Primero selecciona una región'}</option>
                      {selectedRegion?.communes.map((commune) => <option key={commune} value={commune}>{commune}</option>)}
                    </select>
                  </label>
                </div>
                {checkoutError && <p className="form-error" role="alert">{checkoutError}</p>}
                <button className="primary-btn checkout-submit" type="submit" disabled={submitting || Boolean(cartError)}>
                  {submitting ? 'Registrando pedido...' : 'Confirmar pedido'}
                </button>
                <small>{form.payment_method === 'webpay_plus' ? 'Serás redirigido a Transbank para autorizar el pago de forma segura.' : 'El pedido quedará pendiente de pago. No se realizará ningún cobro en línea.'}</small>
              </form>
            </section>
            <aside className="cart-summary checkout-order-summary">
              <h2>Resumen de compra</h2>
              {cartItems.map((item) => (
                <div className="checkout-order-item" key={item.slug}>
                  <span>{item.name} · {formatProductQuantity(item.quantity, item.unit_type)}</span>
                  <strong>{formatPrice(Number(item.price) * item.quantity)}</strong>
                </div>
              ))}
              <div className="summary-total"><span>Subtotal</span><strong>{formatPrice(total)}</strong></div>
              <p>El costo del despacho se informará antes de coordinar el envío.</p>
            </aside>
          </div>
        )
      )}
      {showShippingNotice && (
        <ShippingNotice
          submitting={submitting}
          paymentMethod={form.payment_method}
          onCancel={() => setShowShippingNotice(false)}
          onConfirm={confirmOrder}
        />
      )}
    </main>
  )
}
