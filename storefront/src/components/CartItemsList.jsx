import { formatPrice } from '../services/home.service'
import { formatProductQuantity, formatRollWidth, getProductUnitLabel } from '../utils/productFormatters'
import ProductImage from './ProductImage'

export default function CartItemsList({ items, cartError, onUpdateQuantity, onRemove, onClear }) {
  return (
    <section className="cart-items">
      {cartError && <p className="form-error" role="alert">{cartError}</p>}
      <button className="primary-btn" type="button" onClick={onClear}>Vaciar carrito</button>
      {items.map((item) => (
        <article className="cart-item" key={item.slug}>
          <ProductImage src={item.image_url} alt={item.name} />
          <div>
            <h2>{item.name}</h2>
            <p>{formatPrice(item.price)} por {getProductUnitLabel(item.unit_type)}</p>
            {item.unit_type === 'metro' && item.width_cm && (
              <p className="product-width">Ancho del rollo: {formatRollWidth(item.width_cm)}</p>
            )}
            <div className="quantity-controls">
              <button type="button" aria-label={`Disminuir cantidad de ${item.name}`} onClick={() => onUpdateQuantity(item.slug, item.quantity - 1)}>-</button>
              <span>{formatProductQuantity(item.quantity, item.unit_type)}</span>
              <button type="button" aria-label={`Aumentar cantidad de ${item.name}`} disabled={item.quantity >= item.stock} onClick={() => onUpdateQuantity(item.slug, item.quantity + 1)}>+</button>
              <button className="remove-btn" type="button" onClick={() => onRemove(item.slug)}>Eliminar</button>
            </div>
          </div>
          <strong>{formatPrice(Number(item.price) * item.quantity)}</strong>
        </article>
      ))}
    </section>
  )
}
