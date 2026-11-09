import { Link } from 'react-router-dom'
import useProductCatalog from '../hooks/useProductCatalog'
import ProductCard from '../components/ProductCard'
import CatalogFilters from '../components/CatalogFilters'

export default function ProductCatalogPage({ onAddToCart }) {
  const catalog = useProductCatalog()

  return (
    <main className="catalog-page container page-enter">
      <Link className="back-link" to="/">Volver al inicio</Link>
      <header className="category-heading">
        <span className="eyebrow">Colección Carolina Squella</span>
        <h1>Todos los productos</h1>
        <p>Explora nuestra colección y encuentra lo que buscas.</p>
      </header>

      <CatalogFilters
        categories={catalog.categories}
        search={catalog.search}
        onSearchChange={catalog.setSearch}
        categorySlug={catalog.categorySlug}
        onCategoryChange={catalog.setCategorySlug}
        unitType={catalog.unitType}
        onUnitTypeChange={catalog.setUnitType}
        sortOrder={catalog.sortOrder}
        onSortOrderChange={catalog.setSortOrder}
      />

      {catalog.loading ? (
        <p className="page-state">Cargando productos...</p>
      ) : catalog.error ? (
        <div className="page-state" role="alert">
          <p>{catalog.error}</p>
          <button className="primary-btn" type="button" onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      ) : catalog.visibleProducts.length === 0 ? (
        <p className="page-state">No encontramos productos con esos filtros.</p>
      ) : (
        <>
          <p className="catalog-count" aria-live="polite">
            {catalog.visibleProducts.length} {catalog.visibleProducts.length === 1 ? 'producto' : 'productos'}
          </p>
          <div className="grid">
            {catalog.visibleProducts.map((product, index) => (
              <ProductCard
                key={product.slug}
                product={product}
                index={index}
                badge={product.category?.name || 'Textil'}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </>
      )}
    </main>
  )
}
