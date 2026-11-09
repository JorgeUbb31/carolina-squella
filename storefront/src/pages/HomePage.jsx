import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../services/home.service'
import useHomePageData from '../hooks/useHomePageData'
import ProductCard from '../components/ProductCard'
import QuoteRequestSection from '../components/QuoteRequestSection'

export default function HomePage({ onAddToCart }) {
  const [quoteOpen, setQuoteOpen] = useState(false)
  const { categories, products, loading, error } = useHomePageData()

  return (
    <>
      <div className="topbar">
        <div className="container">
          <span>Envíos a todo Chile</span>
          <span>Atención personalizada</span>
        </div>
      </div>

      <main>
        <section className="hero page-enter">
          <div className="container">
            <div>
              <div className="eyebrow">Cortinas y telas premium</div>
              <h1>Diseña tu hogar con luz y estilo.</h1>
              <p>
                Soluciones en cortinas, telas para ventanas y texturas modernas para cada espacio.
              </p>

              <div className="hero-actions">
                <Link className="primary-btn" to="/products">Ver colección</Link>
                <button className="secondary-btn" type="button" onClick={() => setQuoteOpen(true)}>
                  Solicitar cotización
                </button>
              </div>
            </div>

            <div className="hero-card">
              {loading ? (
                <p>Cargando imagen...</p>
              ) : products[0]?.image_url ? (
                <img src={products[0].image_url} alt={products[0].name} />
              ) : (
                <p>No hay productos disponibles.</p>
              )}
            </div>
          </div>
        </section>

        <QuoteRequestSection open={quoteOpen} onClose={() => setQuoteOpen(false)} />

        <section className="section">
          <div className="container">
            <div className="section-title">
              <h2>Categorías</h2>
            </div>
            {error ? (
              <p>{error}</p>
            ) : loading ? (
              <p>Cargando categorías...</p>
            ) : categories.length === 0 ? (
              <p>No hay categorías disponibles.</p>
            ) : (
              <div className="grid">
                {categories.map((category) => (
                  <Link className="category-card" key={category.slug} to={`/categories/${category.slug}`}>
                    <div className="badge">{category.products_count ?? 0} productos</div>
                    <strong>{category.name}</strong>
                    <p>{category.description}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="section" id="productos-destacados">
          <div className="container">
            <div className="section-title">
              <h2>Productos destacados</h2>
            </div>

            {error ? (
              <div>
                <p>{error}</p>
                <button className="primary-btn" onClick={() => window.location.reload()}>
                  Reintentar
                </button>
              </div>
            ) : loading ? (
              <p>Cargando productos...</p>
            ) : products.length === 0 ? (
              <p>No hay productos disponibles.</p>
            ) : (
              <div className="grid">
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.slug || product.name}
                      product={product}
                      index={index}
                      titleLevel={3}
                      onAddToCart={onAddToCart}
                    />
                  ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
