import { useEffect, useState } from 'react'
import { fetchCategories, fetchProducts } from '../services/api'

const fallbackCategories = [
  { name: 'Blackout', description: 'Oscuridad total y aislamiento' },
  { name: 'Translúcidas', description: 'Luz suave y elegante' },
  { name: 'Lino', description: 'Texturas naturales' },
  { name: 'Accesorios', description: 'Montaje y complementos' }
]

const fallbackProducts = [
  {
    name: 'Cortina Blackout Nube',
    material: 'Microfibra',
    color: 'Gris',
    price: 48900,
    image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    badge: 'Top seller'
  },
  {
    name: 'Cortina Translúcida Aura',
    material: 'Poliéster',
    color: 'Blanco',
    price: 35900,
    image_url: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80',
    badge: 'Nuevo'
  },
  {
    name: 'Tela de Cortina Linen Natural',
    material: 'Lino',
    color: 'Natural',
    price: 18900,
    image_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
    badge: 'Premium'
  },
  {
    name: 'Roller Minimalista Oak',
    material: 'Tejido técnico',
    color: 'Marrón',
    price: 42900,
    image_url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80',
    badge: 'Modern'
  }
]

const formatPrice = (value) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(Number(value ?? 0))
}

export default function HomePage() {
  const [categories, setCategories] = useState(fallbackCategories)
  const [products, setProducts] = useState(fallbackProducts)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesData, productsData] = await Promise.all([
          fetchCategories(),
          fetchProducts()
        ])

        if (categoriesData.length) setCategories(categoriesData)
        if (productsData.length) setProducts(productsData)
      } catch (error) {
        console.error('No se pudo cargar la tienda:', error)
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
              <img src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80" alt="Interior con cortinas" />
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-title">
              <h2>Categorías</h2>
            </div>
            <div className="grid">
              {(categories || []).map((category) => (
                <article className="category-card" key={category.slug || category.name}>
                  <div className="badge">Colección</div>
                  <strong>{category.name}</strong>
                  <p>{category.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-title">
              <h2>Productos destacados</h2>
            </div>

            {loading ? (
              <p>Cargando productos...</p>
            ) : (
              <div className="grid">
                {(products || []).map((product) => (
                  <article className="product-card" key={product.slug || product.name}>
                    <img src={product.image_url || product.image || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80'} alt={product.name} />
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
