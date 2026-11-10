import { useState } from 'react'
import { AlertCircle, Check, ChevronDown, LoaderCircle } from 'lucide-react'
import { FABRIC_WIDTHS, formatFabricWidth, isSoldByMeterCategory } from '../config/inventory'
import createSlug from '../utils/createSlug'
import Modal from './Modal'

const emptyProduct = {
  category_id: '',
  name: '',
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
  unit_type: 'pieza',
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
  const originalCategory = categories.find((category) => String(category.id) === String(product?.category_id))
  const selectedCategory = categories.find((category) => String(category.id) === String(form.category_id))
  const soldByMeter = isSoldByMeterCategory(selectedCategory)
  const wasSoldByMeter = isSoldByMeterCategory(originalCategory)
  const fabricWidths = form.width_cm && !FABRIC_WIDTHS.includes(Number(form.width_cm))
    ? [...FABRIC_WIDTHS, Number(form.width_cm)].sort((left, right) => left - right)
    : FABRIC_WIDTHS

  function change(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const payload = {
      ...form,
      slug: createSlug(form.name),
      category_id: form.category_id ? Number(form.category_id) : null,
      price: Number(form.price),
      stock: Number(form.stock),
      width_cm: soldByMeter
        ? form.width_cm ? Number(form.width_cm) : null
        : wasSoldByMeter
          ? null
          : form.width_cm ? Number(form.width_cm) : null,
      height_cm: soldByMeter
        ? null
        : form.height_cm ? Number(form.height_cm) : null,
      unit_type: soldByMeter
        ? 'metro'
        : String(product?.category_id) === String(form.category_id)
          ? product?.unit_type || 'pieza'
          : 'pieza',
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
      busy={busy}
    >
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field field-wide">Nombre<input value={form.name} onChange={(event) => change('name', event.target.value)} required maxLength="255" /></label>
            <label className="field">Tipo de producto
              <span className="select-wrap"><select value={form.category_id} onChange={(event) => {
                const categoryId = event.target.value
                const category = categories.find((item) => String(item.id) === categoryId)
                setForm((current) => ({
                  ...current,
                  category_id: categoryId,
                  width_cm: soldByMeter !== isSoldByMeterCategory(category) ? '' : current.width_cm,
                }))
              }}>
                <option value="">Selecciona un tipo</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select><ChevronDown size={16} /></span>
            </label>
            <label className="field">{soldByMeter ? 'Precio por metro (CLP)' : 'Precio (CLP)'}<input type="number" min="0" step="1" value={form.price} onChange={(event) => change('price', event.target.value)} required /></label>
            <label className="field">{soldByMeter ? 'Stock disponible (metros)' : 'Stock disponible'}<input type="number" min="0" step="1" value={form.stock} onChange={(event) => change('stock', event.target.value)} required /></label>
            <label className="field">Material<input value={form.material || ''} onChange={(event) => change('material', event.target.value)} maxLength="255" /></label>
            <label className="field">Color<input value={form.color || ''} onChange={(event) => change('color', event.target.value)} /></label>
            <label className="field">Diseño / patrón<input value={form.pattern || ''} onChange={(event) => change('pattern', event.target.value)} /></label>
            {soldByMeter && (
              <label className="field">Ancho del rollo
                <span className="select-wrap"><select value={form.width_cm ? String(form.width_cm) : ''} onChange={(event) => change('width_cm', event.target.value)} required>
                  <option value="">Selecciona ancho</option>{fabricWidths.map((width) => <option key={width} value={width}>{formatFabricWidth(width)} ({width} cm)</option>)}
                </select><ChevronDown size={16} /></span>
              </label>
            )}
            {!soldByMeter && (
              <label className="field">Alto (cm)<input type="number" min="1" step="1" value={form.height_cm || ''} onChange={(event) => change('height_cm', event.target.value)} /></label>
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
          <footer className="modal-actions"><button className="button button-quiet" type="button" onClick={onClose} disabled={busy}>Cancelar</button><button className="button button-primary" type="submit" disabled={busy}>{busy && <LoaderCircle className="spin" size={17} />}{editing ? 'Guardar cambios' : 'Crear producto'}</button></footer>
        </form>
    </Modal>
  )
}
