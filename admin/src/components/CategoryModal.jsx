import { useState } from 'react'
import { AlertCircle, Check, LoaderCircle } from 'lucide-react'
import createSlug from '../utils/createSlug'
import Modal from './Modal'

export default function CategoryModal({ category, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    is_active: category?.is_active ?? true,
  }))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const editing = Boolean(category?.id)

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSave(form, category?.id)
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      className="category-modal"
      eyebrow="TIPO DE PRODUCTO"
      title={editing ? 'Editar categoría' : 'Nueva categoría'}
      onClose={onClose}
    >
        <form onSubmit={handleSubmit}>
          <div className="form-grid category-form-grid">
            <label className="field field-wide">Nombre<input value={form.name} onChange={(event) => {
              const name = event.target.value
              setForm((current) => ({
                ...current,
                name,
                slug: createSlug(name),
              }))
            }} required maxLength="255" /></label>
            <label className="field field-wide">Slug<input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} required maxLength="255" /></label>
            <label className="field field-wide">Descripción<textarea rows="4" value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} /></label>
          </div>
          <label className="check-option category-active-option"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} /><span className="check-box"><Check size={13} /></span>Categoría activa</label>
          {error && <p className="form-error"><AlertCircle size={16} />{error}</p>}
          <footer className="modal-actions"><button className="button button-quiet" type="button" onClick={onClose}>Cancelar</button><button className="button button-primary" type="submit" disabled={busy}>{busy && <LoaderCircle className="spin" size={17} />}{editing ? 'Guardar cambios' : 'Crear categoría'}</button></footer>
        </form>
    </Modal>
  )
}
