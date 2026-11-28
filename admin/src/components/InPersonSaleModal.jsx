import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Plus, Search, Trash2 } from 'lucide-react'
import Modal from './Modal'
import { formatCurrency } from '../utils/formatters'
import { isValidChileanRut } from '../utils/chileanRut'

const PAYMENT_LABELS = {
  cash: 'Efectivo',
  bank_transfer: 'Transferencia',
  debit_card: 'Tarjeta de débito',
  credit_card: 'Tarjeta de crédito',
}

const PHONE_COUNTRY_CODES = [
  { code: '+56', country: 'Chile' },
  { code: '+54', country: 'Argentina' },
  { code: '+591', country: 'Bolivia' },
  { code: '+55', country: 'Brasil' },
  { code: '+57', country: 'Colombia' },
  { code: '+506', country: 'Costa Rica' },
  { code: '+593', country: 'Ecuador' },
  { code: '+34', country: 'España' },
  { code: '+1', country: 'Estados Unidos / Canadá' },
  { code: '+52', country: 'México' },
  { code: '+595', country: 'Paraguay' },
  { code: '+51', country: 'Perú' },
  { code: '+598', country: 'Uruguay' },
]

function parsePhone(phone = '') {
  const cleanPhone = String(phone).trim()
  const country = PHONE_COUNTRY_CODES.find(({ code }) => cleanPhone.startsWith(code))
  if (!country) return { code: '+56', number: cleanPhone.replace(/^\+?56\s*/, '') }
  return { code: country.code, number: cleanPhone.slice(country.code.length).trim() }
}

export default function InPersonSaleModal({
  open,
  form,
  products,
  saving,
  error,
  lookupStatus,
  editing,
  onClose,
  onSubmit,
  onFormChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onRutBlur,
}) {
  const [confirming, setConfirming] = useState(false)
  const [rutError, setRutError] = useState('')
  const phone = parsePhone(form.customer_phone)

  useEffect(() => {
    if (open) {
      setConfirming(false)
      setRutError('')
    }
  }, [open])

  if (!open) return null

  const total = form.items.reduce((sum, item) => {
    const product = products.find((candidate) => Number(candidate.id) === Number(item.product_id))
    return sum + Number(item.unit_price ?? product?.price ?? 0) * Number(item.quantity || 0)
  }, 0)

  function reviewSale(event) {
    event.preventDefault()
    if (!isValidChileanRut(form.customer_rut)) {
      setRutError('Ingresa un RUT chileno válido antes de continuar.')
      return
    }
    setRutError('')
    setConfirming(true)
  }

  return (
    <Modal
      className="in-person-sale-modal"
      eyebrow="VENTA PRESENCIAL"
      title="Registrar nueva venta"
      busy={saving}
      closeOnBackdrop={false}
      onClose={onClose}
    >
      {confirming ? (
        <div className="sale-confirmation">
          <div className="sale-confirmation-heading"><strong>{editing ? 'Confirma la corrección' : 'Confirma la venta'}</strong><span>Revisa los datos antes de guardar.</span></div>
          <dl className="sale-confirmation-customer">
            <div><dt>Cliente</dt><dd>{form.customer_name}</dd></div>
            <div><dt>RUT</dt><dd>{form.customer_rut}</dd></div>
            <div><dt>Teléfono</dt><dd>{form.customer_phone || 'No informado'}</dd></div>
            <div><dt>Pago</dt><dd>{PAYMENT_LABELS[form.payment_method]}</dd></div>
          </dl>
          <ul className="sale-confirmation-items">
            {form.items.map((item, index) => {
              const product = products.find((candidate) => Number(candidate.id) === Number(item.product_id))
              const unitPrice = Number(item.unit_price ?? product?.price ?? 0)
              return <li key={`${item.product_id}-${index}`}><span>{product?.name || item.product_name} × {item.quantity}</span><strong>{formatCurrency(unitPrice * Number(item.quantity))}</strong></li>
            })}
          </ul>
          <div className="sale-confirmation-total"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
          {error && <p className="inline-alert"><span>{error}</span></p>}
          <div className="modal-actions">
            <button className="button button-quiet" type="button" disabled={saving} onClick={() => setConfirming(false)}><ArrowLeft size={16} />Volver a editar</button>
            <button className="button button-primary" type="button" disabled={saving} onClick={onSubmit}>{saving ? 'Guardando…' : <><Check size={16} />Confirmar y guardar</>}</button>
          </div>
        </div>
      ) : (
        <form className="in-person-sale-form in-person-sale-form-modal" onSubmit={reviewSale}>
          <div className="sale-form-grid">
            <label className="field">
              <span>RUT</span>
              <span className="rut-input-control"><input required value={form.customer_rut} onChange={(event) => { setRutError(''); onFormChange('customer_rut', event.target.value) }} onBlur={onRutBlur} placeholder="12.345.678-5" autoComplete="off" inputMode="text" /><Search size={16} /></span>
              {lookupStatus && <small className="rut-lookup-status">{lookupStatus}</small>}
              {rutError && <small className="rut-lookup-error" role="alert">{rutError}</small>}
            </label>
            <label className="field">
              <span>Cliente</span>
              <input required value={form.customer_name} onChange={(event) => onFormChange('customer_name', event.target.value)} placeholder="Nombre del cliente" />
            </label>
            <label className="field">
              <span>Correo</span>
              <input type="email" placeholder="correo@ejemplo.cl" value={form.customer_email} onChange={(event) => onFormChange('customer_email', event.target.value)} />
            </label>
            <label className="field">
              <span>Teléfono</span>
              <span className="phone-input-group">
                <select aria-label="Prefijo telefónico" value={phone.code} onChange={(event) => onFormChange('customer_phone', `${event.target.value} ${phone.number}`.trim())}>
                  {PHONE_COUNTRY_CODES.map(({ code, country }) => <option key={`${country}-${code}`} value={code} title={`${country} (${code})`}>{code}</option>)}
                </select>
                <input type="tel" placeholder="9 1234 5678" value={phone.number} inputMode="tel" onChange={(event) => onFormChange('customer_phone', `${phone.code} ${event.target.value}`.trim())} />
              </span>
            </label>
            <label className="field">
              <span>Método de pago</span>
              <select value={form.payment_method} onChange={(event) => onFormChange('payment_method', event.target.value)}>
                {Object.entries(PAYMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>

          <div className="sale-items">
            {form.items.map((item, index) => (
              <div className="sale-item-row" key={index}>
                <label className="field">
                  <span>Producto</span>
                  <select required value={item.product_id} onChange={(event) => onItemChange(index, 'product_id', event.target.value)}>
                    <option value="">Seleccionar producto</option>
                    {products.map((product) => <option key={product.id} value={product.id}>{product.name} · {formatCurrency(product.price)} · stock {product.stock}</option>)}
                  </select>
                </label>
                <label className="field sale-quantity">
                  <span>Cantidad</span>
                  <input required type="number" min="1" step="1" value={item.quantity} inputMode="numeric" onChange={(event) => onItemChange(index, 'quantity', event.target.value)} />
                </label>
                <button className="icon-button icon-danger" type="button" title="Eliminar producto" aria-label="Eliminar producto" disabled={form.items.length === 1} onClick={() => onRemoveItem(index)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <button className="button button-quiet" type="button" onClick={onAddItem}><Plus size={16} />Agregar producto</button>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions">
            <button className="button button-quiet" type="button" disabled={saving} onClick={onClose}>Cancelar</button>
            <button className="button button-primary" type="submit" disabled={saving || lookupStatus === 'Buscando cliente…'}>{editing ? 'Revisar corrección' : 'Revisar venta'}</button>
          </div>
        </form>
      )}
    </Modal>
  )
}
