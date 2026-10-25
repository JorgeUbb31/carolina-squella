import { useEffect, useState } from 'react'
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
  LogIn,
  Pencil,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import {
  clearToken,
  deleteProduct,
  getCategories,
  getCurrentUser,
  getProducts,
  getToken,
  login,
  logout,
  saveProduct,
} from './services/api'

const emptyProduct = {
  category_id: '',
  name: '',
  slug: '',
  description: '',
  price: '',
  stock: '0',
  material: '',
  color: '',
  pattern: '',
  width_cm: '',
  height_cm: '',
  is_blackout: false,
  is_thermal: false,
  is_waterproof: false,
  sample_available: false,
  unit_type: 'unidad',
  image_url: '',
  is_active: true,
}

const FABRIC_WIDTHS = [150, 250, 280]

const money = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

function toFormProduct(product = emptyProduct) {
  return Object.fromEntries(
    Object.entries(emptyProduct).map(([key, fallback]) => [key, product[key] ?? fallback]),
  )
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onLogin(email, password)
    } catch (loginError) {
      setError(loginError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-brand"><span className="brand-mark">CS</span><span>CAROLINA SQUELLA</span></div>
        <div className="login-copy">
          <span className="eyebrow">OPERACIONES · INVENTARIO</span>
          <h1>Control claro.<br /><em>Stock al día.</em></h1>
          <p>Ingresa para administrar productos, disponibilidad y niveles de inventario.</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error && <p className="form-error"><AlertCircle size={16} />{error}</p>}
          <button className="button button-primary login-submit" type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={18} /> : <LogIn size={18} />}
            {busy ? 'Ingresando…' : 'Ingresar al inventario'}
          </button>
        </form>
        <div className="login-foot"><ShieldCheck size={16} /> Acceso protegido para administración</div>
      </section>
      <aside className="login-art" aria-label="Textiles de Carolina Squella">
        <div className="art-stamp"><Sparkles size={18} /><span>HECHO PARA DURAR</span></div>
        <div className="art-caption"><span>01 / COLECCIÓN HOGAR</span><strong>Texturas que<br />visten espacios.</strong></div>
      </aside>
    </main>
  )
}

function ProductModal({ product, categories, onClose, onSave }) {
  const [form, setForm] = useState(() => toFormProduct(product || emptyProduct))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const editing = Boolean(product?.id)
  const selectedCategory = categories.find((category) => String(category.id) === String(form.category_id))
  const isRoller = selectedCategory?.slug === 'cortinas-roller'

  function change(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const payload = {
      ...form,
      category_id: form.category_id ? Number(form.category_id) : null,
      price: Number(form.price),
      stock: Number(form.stock),
      width_cm: isRoller ? null : form.width_cm ? Number(form.width_cm) : null,
      height_cm: null,
      unit_type: isRoller ? 'unidad' : form.unit_type || 'metro',
    }
    try {
      await onSave(payload, product?.id)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
        <header className="modal-head">
          <div><span className="eyebrow">FICHA DE PRODUCTO</span><h2 id="product-modal-title">{editing ? 'Editar producto' : 'Nuevo producto'}</h2></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button>
        </header>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field field-wide">Nombre<input value={form.name} onChange={(event) => change('name', event.target.value)} required maxLength="255" /></label>
            <label className="field">Slug<input value={form.slug} onChange={(event) => change('slug', event.target.value)} required maxLength="255" /></label>
            <label className="field">Tipo de producto
              <span className="select-wrap"><select value={form.category_id} onChange={(event) => change('category_id', event.target.value)}>
                <option value="">Selecciona un tipo</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select><ChevronDown size={16} /></span>
            </label>
            <label className="field">Precio (CLP)<input type="number" min="0" step="1" value={form.price} onChange={(event) => change('price', event.target.value)} required /></label>
            <label className="field">Stock disponible<input type="number" min="0" step="1" value={form.stock} onChange={(event) => change('stock', event.target.value)} required /></label>
            <label className="field">Color<input value={form.color || ''} onChange={(event) => change('color', event.target.value)} /></label>
            <label className="field">Diseño / patrón<input value={form.pattern || ''} onChange={(event) => change('pattern', event.target.value)} /></label>
            {isRoller ? (
              <div className="roller-note field field-wide"><Check size={16} /><span>Las cortinas roller usan sus medidas propias y no requieren ancho ni alto en el inventario.</span></div>
            ) : (
              <label className="field">Ancho de la tela
                <span className="select-wrap"><select value={form.width_cm ? String(form.width_cm) : ''} onChange={(event) => change('width_cm', event.target.value)}>
                  <option value="">Selecciona ancho</option>{FABRIC_WIDTHS.map((width) => <option key={width} value={width}>{(width / 100).toFixed(2).replace('.00', '')} m ({width} cm)</option>)}
                </select><ChevronDown size={16} /></span>
              </label>
            )}
            <label className="field field-wide">URL de imagen<input type="url" value={form.image_url || ''} onChange={(event) => change('image_url', event.target.value)} /></label>
            <label className="field field-wide">Descripción<textarea rows="3" value={form.description || ''} onChange={(event) => change('description', event.target.value)} /></label>
          </div>
          <div className="toggle-grid">
            {[[ 'is_blackout', 'Blackout' ], [ 'is_thermal', 'Térmico' ], [ 'is_waterproof', 'Impermeable' ], [ 'sample_available', 'Muestra disponible' ], [ 'is_active', 'Producto activo' ]].map(([key, label]) => (
              <label className="check-option" key={key}><input type="checkbox" checked={Boolean(form[key])} onChange={(event) => change(key, event.target.checked)} /><span className="check-box"><Check size={13} /></span>{label}</label>
            ))}
          </div>
          {error && <p className="form-error"><AlertCircle size={16} />{error}</p>}
          <footer className="modal-actions"><button className="button button-quiet" type="button" onClick={onClose}>Cancelar</button><button className="button button-primary" type="submit" disabled={busy}>{busy && <LoaderCircle className="spin" size={17} />}{editing ? 'Guardar cambios' : 'Crear producto'}</button></footer>
        </form>
      </section>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [lowStock, setLowStock] = useState(false)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingProduct, setEditingProduct] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    if (!getToken()) {
      setAuthReady(true)
      return
    }
    getCurrentUser()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setAuthReady(true))
  }, [])

  useEffect(() => {
    if (!user) return
    getCategories().then(setCategories).catch((loadError) => setError(loadError.message))
  }, [user])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setError('')
    const params = { per_page: '20', page: String(page) }
    if (search.trim()) params.search = search.trim()
    if (categoryId) params.category_id = categoryId
    if (lowStock) params.low_stock_below = '5'
    getProducts(params)
      .then((result) => {
        if (cancelled) return
        setProducts(result.data || [])
        setPagination({ current_page: result.current_page, last_page: result.last_page, total: result.total })
      })
      .catch((loadError) => {
        if (cancelled) return
        setError(loadError.message)
        if (!getToken()) setUser(null)
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user, page, search, categoryId, lowStock])

  async function handleLogin(email, password) {
    const loggedInUser = await login(email, password)
    setUser(loggedInUser)
  }

  async function handleLogout() {
    try { await logout() } catch { clearToken() }
    setUser(null)
    setProducts([])
  }

  async function handleSave(productData, id) {
    await saveProduct(productData, id)
    setModalOpen(false)
    setEditingProduct(null)
    setNotice(id ? 'Producto actualizado.' : 'Producto creado correctamente.')
    setPage(1)
    await refreshProducts()
  }

  async function refreshProducts() {
    const params = { per_page: '20', page: String(page) }
    if (search.trim()) params.search = search.trim()
    if (categoryId) params.category_id = categoryId
    if (lowStock) params.low_stock_below = '5'
    const result = await getProducts(params)
    setProducts(result.data || [])
    setPagination({ current_page: result.current_page, last_page: result.last_page, total: result.total })
  }

  async function handleDelete(product) {
    if (!window.confirm(`¿Eliminar “${product.name}”? Esta acción no se puede deshacer.`)) return
    try {
      await deleteProduct(product.id)
      setNotice('Producto eliminado.')
      await refreshProducts()
    } catch (deleteError) {
      setError(deleteError.message)
    }
  }

  if (!authReady) return <main className="loading-screen"><LoaderCircle className="spin" size={28} /><span>Preparando inventario…</span></main>
  if (!user) return <LoginScreen onLogin={handleLogin} />

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="sidebar-brand" href="#inventory"><span className="brand-mark">CS</span><span>CAROLINA<br /><b>SQUELLA</b></span></a>
        <a className="side-link side-link-active" href="#inventory"><Boxes size={18} /><span>Inventario</span><span className="side-count">{pagination.total}</span></a>
        <div className="sidebar-bottom"><div className="user-chip"><span className="user-avatar">{(user.name || user.email || 'A').slice(0, 1).toUpperCase()}</span><span className="user-info"><b>{user.name || 'Administración'}</b><small>{user.email}</small></span></div><button className="logout-button" onClick={handleLogout} title="Cerrar sesión" aria-label="Cerrar sesión"><DoorOpen size={18} /></button></div>
      </aside>

      <main className="main-content" id="inventory">
        <section className="page-content">
          <div className="page-heading"><div><h1>Inventario<span className="heading-period">.</span></h1></div><button className="button button-primary" onClick={() => { setEditingProduct(null); setModalOpen(true) }}><CirclePlus size={18} />Nuevo producto</button></div>

          <section className="inventory-section">
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
                      <td className="price-cell">{money.format(Number(product.price || 0))}</td>
                      <td><span className={`stock-pill ${product.stock === 0 ? 'stock-empty' : product.stock <= 5 ? 'stock-low' : 'stock-ok'}`}><i />{product.stock} <small>{product.unit_type || 'unid.'}</small></span></td>
                      <td><span className={`status-label ${product.is_active ? 'status-active' : 'status-inactive'}`}>{product.is_active ? 'Activo' : 'Inactivo'}</span></td>
                      <td><div className="row-actions"><button className="icon-button" type="button" title="Editar producto" aria-label={`Editar ${product.name}`} onClick={() => { setEditingProduct(product); setModalOpen(true) }}><Pencil size={16} /></button><button className="icon-button icon-danger" type="button" title="Eliminar producto" aria-label={`Eliminar ${product.name}`} onClick={() => handleDelete(product)}><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}
                  {!loading && products.length === 0 && <tr><td className="table-state empty-state" colSpan="6"><div className="empty-symbol"><Boxes size={24} /></div><strong>No encontramos productos</strong><span>Prueba otro filtro o crea un producto nuevo.</span><button className="button button-quiet" onClick={() => { setSearch(''); setCategoryId(''); setLowStock(false) }}>Limpiar filtros</button></td></tr>}
                </tbody>
              </table>
            </div>
            <footer className="table-footer"><span>Mostrando {products.length ? (pagination.current_page - 1) * 20 + 1 : 0}–{(pagination.current_page - 1) * 20 + products.length} de {pagination.total}</span><div className="pagination"><button className="icon-button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} aria-label="Página anterior"><ArrowLeft size={16} /></button><span>Página <b>{pagination.current_page || 1}</b> de {pagination.last_page || 1}</span><button className="icon-button" disabled={page >= pagination.last_page || loading} onClick={() => setPage((current) => current + 1)} aria-label="Página siguiente"><ArrowRight size={16} /></button></div></footer>
          </section>
        </section>
      </main>
      {modalOpen && <ProductModal product={editingProduct} categories={categories} onClose={() => { setModalOpen(false); setEditingProduct(null) }} onSave={handleSave} />}
    </div>
  )
}

export default App