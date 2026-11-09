import { Link } from 'react-router-dom'
import { formatPrice } from '../services/home.service'
import { formatRollWidth, getProductUnitLabel } from '../utils/productFormatters'

export default function ProductCard({ product, index = 0, badge, titleLevel = 2, onAddToCart }) {
  const badgeLabel = badge ?? product.badge ?? (
    product.unit_type === 'metro' ? 'Venta por metro' : 'Destacado'
  )
  const Title = titleLevel === 3 ? 'h3' : 'h2'

  return (
    <article className="product-card reveal-card" style={{ '--delay': `${index * 80}ms` }}>
      <Link to={`/products/${product.slug}`}>
        <img src={product.image_url} alt={product.name} />
      </Link>
      <div className="product-body">
        <div className="badge">{badgeLabel}</div>
        <Title><Link to={`/products/${product.slug}`}>{product.name}</Link></Title>
        <div className="meta">
          <span>{product.material || 'Textil'}</span>
          <span>{product.color || 'Variado'}</span>
        </div>
        {product.unit_type === 'metro' && product.width_cm && (
          <p className="product-width">Ancho del rollo: {formatRollWidth(product.width_cm)}</p>
        )}
        <div className="price-row">
          <span>
            <span className="price">{formatPrice(product.price)}</span>
            <small className="price-unit">por {getProductUnitLabel(product.unit_type)}</small>
          </span>
          {onAddToCart && (
            <button className="primary-btn" type="button" onClick={() => onAddToCart(product)}>
              Añadir
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
