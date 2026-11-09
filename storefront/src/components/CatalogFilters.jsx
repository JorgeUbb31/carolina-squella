export default function CatalogFilters({
  categories,
  search,
  onSearchChange,
  categorySlug,
  onCategoryChange,
  unitType,
  onUnitTypeChange,
  sortOrder,
  onSortOrderChange
}) {
  return (
    <section className="catalog-controls" aria-label="Filtros de productos">
      <label>
        Buscar
        <input
          type="search"
          name="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Nombre, material o color"
        />
      </label>
      <label>
        Categoría
        <select name="categorySlug" value={categorySlug} onChange={(event) => onCategoryChange(event.target.value)}>
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>{category.name}</option>
          ))}
        </select>
      </label>
      <label>
        Tipo de venta
        <select name="unitType" value={unitType} onChange={(event) => onUnitTypeChange(event.target.value)}>
          <option value="">Todos</option>
          <option value="pieza">Por pieza</option>
          <option value="metro">Por metro</option>
        </select>
      </label>
      <label>
        Ordenar por precio
        <select name="sortOrder" value={sortOrder} onChange={(event) => onSortOrderChange(event.target.value)}>
          <option value="">Recomendados</option>
          <option value="price-asc">Menor a mayor</option>
          <option value="price-desc">Mayor a menor</option>
        </select>
      </label>
    </section>
  )
}
