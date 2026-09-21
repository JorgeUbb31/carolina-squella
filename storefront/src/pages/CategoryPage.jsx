import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchCategoryProducts } from '../services/api'
import { formatPrice } from '../services/home.service'

export default function CategoryPage({ onAddToCart }) {
  const { slug } = useParams()
  const [category, setCategory] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCategory = async () => {
      try {
        setLoading(true)
        setError('')
        const data = await fetchCategoryProducts(slug)
        setCategory(data.category)
        setProducts(data.products ?? [])
      } catch (loadError) {
        setError(loadError.message)
      } finally {
        setLoading(false)
      }
    }

    loadCategory()
  }, [slug])

  if (loading) return <main className="page-state">Cargando Productos...</main>

  if (error || !category) {
    return (
      <main className="page-state">
        <p>{error || 'Categoría no encontrada.'}</p>
        <Link className="primary-btn" to="/">Volver</Link>
      </main>
    )
  }

  return (
    <main className="category-page container page-enter">
      <Link className="back-link" to="/">Volver</Link>
      <header className="category-heading">
        <span className="eyebrow">Colección Carolina Squella</span>
        <h1>{category.name}</h1>
        <p>{category.description}</p>
      </header>

      {products.length === 0 ? (
        <div className="page-state">
          <p>Aún no hay productos en esta categoría.</p>
        </div>
      ) : (
        <div className="grid">
          {products.map((product, index) => (
            <article className="product-card reveal-card" style={{ '--delay': `${index * 80}ms` }} key={product.slug}>
              <Link to={`/products/${product.slug}`}>
                <img src={product.image_url} alt={product.name} />
              </Link>
              <div className="product-body">
                <span className="badge">{product.unit_type || 'pieza'}</span>
                <h2><Link to={`/products/${product.slug}`}>{product.name}</Link></h2>
                <div className="meta">
                  <span>{product.material || 'Textil'}</span>
                  <span>{product.color || 'Variado'}</span>
                </div>
                <div className="price-row">
                  <span className="price">{formatPrice(product.price)}</span>
                  <button className="primary-btn" onClick={() => onAddToCart(product)}>
                    Añadir
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
