import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Boxes,
  Check,
  ChevronDown,
  CirclePlus,
  DoorOpen,
  LoaderCircle,
  Pencil,
  Search,
  SlidersHorizontal,
  Tags,
  Trash2,
  X,
} from 'lucide-react'
import { INVENTORY_PAGE_SIZE } from '../config/inventory'

export default function InventoryPage({
  user,
  onLogout,
  activeSection,
  setActiveSection,
  pagination,
  adminCategories,
  onCreateProduct,
  onCreateCategory,
  lowStock,
  setLowStock,
  setPage,
  search,
  setSearch,
  categoryId,
  setCategoryId,
  categories,
  error,
  setError,
  notice,
  setNotice,
  loading,
  products,
  money,
  onEditProduct,
  onDeleteProduct,
  page,
  onEditCategory,
  onDeleteCategory,
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="sidebar-brand" href="#inventory"><span className="brand-mark">CS</span><span>CAROLINA<br /><b>SQUELLA</b></span></a>
        <button className={`side-link ${activeSection === 'products' ? 'side-link-active' : ''}`} type="button" onClick={() => setActiveSection('products')}><Boxes size={18} /><span>Inventario</span><span className="side-count">{pagination.total}</span></button>
        <button className={`side-link ${activeSection === 'categories' ? 'side-link-active' : ''}`} type="button" onClick={() => setActiveSection('categories')}><Tags size={18} /><span>Categorías</span><span className="side-count">{adminCategories.length}</span></button>
        <div className="sidebar-bottom"><div className="user-chip"><span className="user-avatar">{(user.name || user.email || 'A').slice(0, 1).toUpperCase()}</span><span className="user-info"><b>{user.name || 'Administración'}</b><small>{user.email}</small></span></div><button className="logout-button" onClick={onLogout} title="Cerrar sesión" aria-label="Cerrar sesión"><DoorOpen size={18} /></button></div>
      </aside>

      <main className="main-content" id="inventory">
        <section className="page-content">
          <div className="page-heading"><div><h1>{activeSection === 'products' ? 'Inventario.' : 'Categorías.'}</h1></div><button className="button button-primary" onClick={activeSection === 'products' ? onCreateProduct : onCreateCategory}><CirclePlus size={18} />{activeSection === 'products' ? 'Nuevo producto' : 'Nueva categoría'}</button></div>

          {activeSection === 'products' ? <section className="inventory-section">
            <div className="section-heading"><div><h2>Productos</h2><span>{pagination.total} registros</span></div><button className={`filter-toggle ${lowStock ? 'filter-toggle-on' : ''}`} onClick={() => { setLowStock((current) => !current); setPage(1) }}><SlidersHorizontal size={16} />{lowStock ? 'Ver todos' : 'Stock bajo'}</button></div>
            <div className="toolbar">
              <label className="search-control"><Search size={17} /><input placeholder="Buscar por nombre…" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /><kbd>⌘ K</kbd></label>
              <label className="category-control"><span>Categoría</span><span className="select-wrap"><select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1) }}><option value="">Todas</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><ChevronDown size={15} /></span></label>
            </div>

            {error && <div className="inline-alert"><AlertCircle size={17} /><span>{error}</span><button onClick={() => setError('')} aria-label="Cerrar alerta"><X size={16} /></button></div>}
            {notice && <div className="inline-success"><Check size={17} /><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Cerrar aviso"><X size={16} /></button></div>}

            <div className="table-wrap">
              <table>
                <thead><tr><th>PRODUCTO</th><th>CATEGORÍA</th><th>PRECIO</th><th>STOCK</th><th>ESTADO</th><th><span className="sr-only">Acciones</span></th></tr></thead>
                <tbody>
                  {loading && <tr><td className="table-state" colSpan="6"><LoaderCircle className="spin" size={20} />Cargando productos…</td></tr>}
                  {!loading && products.map((product) => (
                    <tr key={product.id}>
                      <td><div className="product-cell"><div className="product-thumbnail">{product.image_url ? <img src={product.image_url} alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} /> : <span>{(product.name || 'P').slice(0, 1)}</span>}</div><div><strong>{product.name}</strong><small>{product.material || 'Sin material'}{product.color ? ` · ${product.color}` : ''}</small></div></div></td>
                      <td className="category-cell">{product.category?.name || 'Sin categoría'}</td>
                      <td className="price-cell">{money(Number(product.price || 0))}</td>
                      <td><span className={`stock-pill ${product.stock === 0 ? 'stock-empty' : product.stock <= 5 ? 'stock-low' : 'stock-ok'}`}><i />{product.stock} <small>{product.unit_type || 'unid.'}</small></span></td>
                      <td><span className={`status-label ${product.is_active ? 'status-active' : 'status-inactive'}`}>{product.is_active ? 'Activo' : 'Inactivo'}</span></td>
                      <td><div className="row-actions"><button className="icon-button" type="button" title="Editar producto" aria-label={`Editar ${product.name}`} onClick={() => onEditProduct(product)}><Pencil size={16} /></button><button className="icon-button icon-danger" type="button" title="Eliminar producto" aria-label={`Eliminar ${product.name}`} onClick={() => onDeleteProduct(product)}><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}
                  {!loading && products.length === 0 && <tr><td className="table-state empty-state" colSpan="6"><div className="empty-symbol"><Boxes size={24} /></div><strong>No encontramos productos</strong><span>Prueba otro filtro o crea un producto nuevo.</span><button className="button button-quiet" onClick={() => { setSearch(''); setCategoryId(''); setLowStock(false) }}>Limpiar filtros</button></td></tr>}
                </tbody>
              </table>
            </div>
            <footer className="table-footer"><span>Mostrando {products.length ? (pagination.current_page - 1) * INVENTORY_PAGE_SIZE + 1 : 0}–{(pagination.current_page - 1) * INVENTORY_PAGE_SIZE + products.length} de {pagination.total}</span><div className="pagination"><button className="icon-button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} aria-label="Página anterior"><ArrowLeft size={16} /></button><span>Página <b>{pagination.current_page || 1}</b> de {pagination.last_page || 1}</span><button className="icon-button" disabled={page >= pagination.last_page || loading} onClick={() => setPage((current) => current + 1)} aria-label="Página siguiente"><ArrowRight size={16} /></button></div></footer>
          </section> : (
            <section className="inventory-section">
              <div className="section-heading"><div><h2>Tipos de producto</h2><span>{adminCategories.length} categorías</span></div></div>
              {error && <div className="inline-alert"><AlertCircle size={17} /><span>{error}</span><button onClick={() => setError('')} aria-label="Cerrar alerta"><X size={16} /></button></div>}
              {notice && <div className="inline-success"><Check size={17} /><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Cerrar aviso"><X size={16} /></button></div>}
              <div className="table-wrap">
                <table>
                  <thead><tr><th>CATEGORÍA</th><th>DESCRIPCIÓN</th><th>PRODUCTOS</th><th>ESTADO</th><th><span className="sr-only">Acciones</span></th></tr></thead>
                  <tbody>
                    {adminCategories.map((category) => (
                      <tr key={category.id}>
                        <td><strong className="category-name-cell">{category.name}</strong><small className="category-slug">/{category.slug}</small></td>
                        <td className="category-description">{category.description || 'Sin descripción'}</td>
                        <td className="price-cell">{category.products_count || 0}</td>
                        <td><span className={`status-label ${category.is_active ? 'status-active' : 'status-inactive'}`}>{category.is_active ? 'Activa' : 'Inactiva'}</span></td>
                        <td><div className="row-actions"><button className="icon-button" type="button" title="Editar categoría" aria-label={`Editar ${category.name}`} onClick={() => onEditCategory(category)}><Pencil size={16} /></button><button className="icon-button icon-danger" type="button" title="Eliminar categoría" aria-label={`Eliminar ${category.name}`} onClick={() => onDeleteCategory(category)}><Trash2 size={16} /></button></div></td>
                      </tr>
                    ))}
                    {adminCategories.length === 0 && <tr><td className="table-state empty-state" colSpan="5"><strong>No hay categorías</strong><span>Crea la primera categoría para clasificar productos.</span></td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </section>
      </main>
    </div>
  )
}
