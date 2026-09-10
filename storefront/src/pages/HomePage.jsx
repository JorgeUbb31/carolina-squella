import { useEffect, useState } from 'react'
import { formatPrice, loadHomeData } from '../services/home.service'

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        setError('')
        const homeData = await loadHomeData()

        setCategories(homeData.categories)
        setProducts(homeData.products)
      } catch (error) {
        console.error('No se pudo cargar la tienda:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <>
      <div className="topbar">
        <div className="container">
          <span>Envíos a todo Chile</span>
          <span>Atención personalizada</span>
        </div>
      </div>

      <header className="header">
        <div className="container">
          <div className="brand">Carolina Squella</div>
          <nav className="nav">
            <a href="#">Inicio</a>
            <a href="#">Cortinas</a>
            <a href="#">Telas</a>
            <a href="#">Blackout</a>
            <a href="#">Accesorios</a>
          </nav>
          <div className="actions">
            <button className="secondary-btn">Buscar</button>
            <button className="primary-btn">Carrito</button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <div>
              <div className="eyebrow">Cortinas y telas premium</div>
              <h1>Diseña tu hogar con luz y estilo.</h1>
              <p>
                Soluciones en cortinas, telas para ventanas y texturas modernas para cada espacio.
              </p>

              <div className="hero-actions">
                <button className="primary-btn">Ver colección</button>
                <button className="secondary-btn">Solicitar cotización</button>
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
                  <article className="category-card" key={category.slug}>
                    <div className="badge">{category.products_count ?? 0} productos</div>
                    <strong>{category.name}</strong>
                    <p>{category.description}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="section">
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
                {products.map((product) => (
                  <article className="product-card" key={product.slug || product.name}>
                    <img src={product.image_url} alt={product.name} />
                    <div className="product-body">
                      <div className="badge">{product.badge || 'Destacado'}</div>
                      <h3>{product.name}</h3>
                      <div className="meta">
                        <span>{product.material || 'Textil'}</span>
                        <span>{product.color || 'Variado'}</span>
                      </div>
                      <div className="price-row">
                        <span className="price">{formatPrice(product.price)}</span>
                        <button className="primary-btn">Añadir</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
