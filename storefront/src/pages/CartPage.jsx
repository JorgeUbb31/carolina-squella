import { Link } from 'react-router-dom'
import { formatPrice } from '../services/home.service'

export default function CartPage({ cartItems, onUpdateQuantity, onRemove }) {
  const total = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)

  return (
    <main className="cart-page container">
      <div className="section-title">
        <h1>Tu carrito</h1>
        <Link className="secondary-btn" to="/">Seguir comprando</Link>
      </div>
      {cartItems.length === 0 ? (
        <div className="page-state">
          <p>Tu carrito está vacío.</p>
          <Link className="primary-btn" to="/">Ver productos</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items">
            {cartItems.map((item) => (
              <article className="cart-item" key={item.slug}>
                <img src={item.image_url} alt={item.name} />
                <div>
                  <h2>{item.name}</h2>
                  <p>{formatPrice(item.price)} por {item.unit_type || 'pieza'}</p>
                  <div className="quantity-controls">
                    <button aria-label={`Disminuir cantidad de ${item.name}`} onClick={() => onUpdateQuantity(item.slug, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button aria-label={`Aumentar cantidad de ${item.name}`} onClick={() => onUpdateQuantity(item.slug, item.quantity + 1)}>+</button>
                    <button className="remove-btn" onClick={() => onRemove(item.slug)}>Eliminar</button>
                  </div>
                </div>
                <strong>{formatPrice(Number(item.price) * item.quantity)}</strong>
              </article>
            ))}
          </section>
          <aside className="cart-summary">
            <h2>Resumen</h2>
            <div><span>Subtotal</span><strong>{formatPrice(total)}</strong></div>
            <p>El despacho y la cotización final se calculan en el checkout.</p>
            <button className="primary-btn" disabled>Continuar al checkout</button>
          </aside>
        </div>
      )}
    </main>
  )
}
