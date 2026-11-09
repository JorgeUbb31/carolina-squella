import { formatPrice } from '../services/home.service'
import { formatProductQuantity } from '../utils/productFormatters'

export default function CheckoutOrderSummary({ items, total }) {
  return (
    <aside className="cart-summary checkout-order-summary">
      <h2>Resumen de compra</h2>
      {items.map((item) => (
        <div className="checkout-order-item" key={item.slug}>
          <span>{item.name} · {formatProductQuantity(item.quantity, item.unit_type)}</span>
          <strong>{formatPrice(Number(item.price) * item.quantity)}</strong>
        </div>
      ))}
      <div className="summary-total"><span>Subtotal</span><strong>{formatPrice(total)}</strong></div>
      <p>El costo del despacho se informará antes de coordinar el envío.</p>
    </aside>
  )
}
