import { Link, useParams } from 'react-router-dom'
import useCategoryProducts from '../hooks/useCategoryProducts'
import ProductCard from '../components/ProductCard'
import { getProductUnitLabel } from '../utils/productFormatters'

export default function CategoryPage({ onAddToCart }) {
  const { slug } = useParams()
  const { category, products, loading, error } = useCategoryProducts(slug)

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
            <ProductCard
              key={product.slug}
              product={product}
              index={index}
              badge={`Por ${getProductUnitLabel(product.unit_type)}`}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </main>
  )
}
