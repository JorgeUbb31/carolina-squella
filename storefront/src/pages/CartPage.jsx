import { Link } from 'react-router-dom'
import CartItemsList from '../components/CartItemsList'
import CheckoutForm from '../components/CheckoutForm'
import CheckoutOrderSummary from '../components/CheckoutOrderSummary'
import ShippingNotice from '../components/ShippingNotice'
import useCheckout from '../hooks/useCheckout'
import { formatPrice } from '../services/home.service'

export default function CartPage({ cartItems, cartToken, cartError, onUpdateQuantity, onRemove, onClear }) {
  const checkout = useCheckout(cartToken, onClear)
  const total = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

  return (
    <main className="cart-page container page-enter">
      <div className="section-title">
        <h1>Tu carrito</h1>
        <Link className="secondary-btn" to="/">Seguir comprando</Link>
      </div>
      {checkout.completedOrder && (
        <section className="order-confirmation" role="status">
          <span className="eyebrow">Pedido registrado</span>
          <h2>Gracias por tu compra</h2>
          <p>Tu número de pedido es <strong>{checkout.completedOrder.order_number}</strong>. Te contactaremos para coordinar el pago por transferencia y confirmar el despacho.</p>
          <Link className="secondary-btn" to="/">Volver a la tienda</Link>
        </section>
      )}
      {cartItems.length === 0 ? (
        !checkout.completedOrder && (
          <div className="page-state">
            <p>Tu carrito está vacío.</p>
            <Link className="primary-btn" to="/">Ver productos</Link>
          </div>
        )
      ) : !checkout.completedOrder && (
        checkout.step === 'cart' ? (
          <div className="cart-layout">
            <CartItemsList
              items={cartItems}
              cartError={cartError}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemove}
              onClear={onClear}
            />
            <aside className="cart-summary">
              <h2>Resumen de compra</h2>
              <div className="summary-total"><span>Subtotal</span><strong>{formatPrice(total)}</strong></div>
              <p>El despacho se cotiza y confirma contigo antes del pago.</p>
              <button
                className="primary-btn checkout-submit"
                type="button"
                disabled={Boolean(cartError)}
                onClick={() => checkout.setStep('checkout')}
              >
                Continuar con la compra
              </button>
            </aside>
          </div>
        ) : (
          <div className="cart-layout checkout-layout">
            <section className="cart-summary checkout-details">
              <button className="secondary-btn checkout-back" type="button" onClick={() => checkout.setStep('cart')}>Volver al carrito</button>
              <h2>Datos de entrega</h2>
              <p>Ingresa tus datos para preparar el pedido. El costo del despacho se cotiza contigo.</p>
              <CheckoutForm
                form={checkout.form}
                onChange={checkout.updateField}
                error={checkout.error}
                submitting={checkout.submitting}
                disabled={Boolean(cartError)}
                onSubmit={checkout.handleSubmit}
              />
            </section>
            <CheckoutOrderSummary items={cartItems} total={total} />
          </div>
        )
      )}
      {checkout.showShippingNotice && (
        <ShippingNotice
          submitting={checkout.submitting}
          paymentMethod={checkout.form.payment_method}
          onCancel={() => checkout.setShowShippingNotice(false)}
          onConfirm={checkout.confirmOrder}
        />
      )}
    </main>
  )
}
