import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchProduct } from '../services/api'
import { formatPrice } from '../services/home.service'

export default function ProductPage({ onAddToCart }) {
  const { slug } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setError('')
        setProduct(await fetchProduct(slug))
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [slug])

  if (loading) return <main className="page-state">Cargando producto...</main>
  if (error || !product) {
    return (
      <main className="page-state">
        <p>{error || 'Producto no encontrado.'}</p>
        <Link className="primary-btn" to="/">Volver a la tienda</Link>
      </main>
    )
  }

  return (
    <main className="product-detail container page-enter">
      <Link className="back-link" to="/">Volver a la tienda</Link>
      <div className="product-detail-grid">
        <img src={product.image_url} alt={product.name} />
        <section>
          <span className="badge">{product.category?.name || 'Textil'}</span>
          <h1>{product.name}</h1>
          <p className="detail-price">{formatPrice(product.price)}</p>
          <p>{product.description}</p>
          <dl className="specifications">
            <div><dt>Material</dt><dd>{product.material || 'No informado'}</dd></div>
            <div><dt>Color</dt><dd>{product.color || 'No informado'}</dd></div>
            <div><dt>Unidad</dt><dd>{product.unit_type || 'pieza'}</dd></div>
            <div><dt>Medidas</dt><dd>{product.width_cm && product.height_cm ? `${product.width_cm} x ${product.height_cm} cm` : 'A medida'}</dd></div>
          </dl>
          <button className="primary-btn" onClick={() => onAddToCart(product)}>
            Añadir al carrito
          </button>
        </section>
      </div>
    </main>
  )
}
