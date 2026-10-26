import { useState } from 'react'
import { AlertCircle, Check, ChevronDown, LoaderCircle } from 'lucide-react'
import { FABRIC_WIDTHS } from '../config/inventory'
import createSlug from '../utils/createSlug'
import Modal from './Modal'

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

function toFormProduct(product = emptyProduct) {
  return Object.fromEntries(
    Object.entries(emptyProduct).map(([key, fallback]) => [key, product[key] ?? fallback]),
  )
}

export default function ProductModal({ product, categories, onClose, onSave }) {
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
    <Modal
      className="product-modal"
      eyebrow="FICHA DE PRODUCTO"
      title={editing ? 'Editar producto' : 'Nuevo producto'}
      onClose={onClose}
    >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field field-wide">Nombre<input value={form.name} onChange={(event) => {
              const name = event.target.value
              setForm((current) => ({ ...current, name, slug: createSlug(name) }))
            }} required maxLength="255" /></label>
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
    </Modal>
  )
}
