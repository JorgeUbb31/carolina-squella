import { Plus, Trash2 } from 'lucide-react'
import Modal from './Modal'
import { formatCurrency } from '../utils/formatters'

const PAYMENT_LABELS = {
  cash: 'Efectivo',
  bank_transfer: 'Transferencia',
  debit_card: 'Tarjeta de débito',
  credit_card: 'Tarjeta de crédito',
}

export default function InPersonSaleModal({
  open,
  form,
  products,
  saving,
  onClose,
  onSubmit,
  onFormChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
}) {
  if (!open) return null

  return (
    <Modal
      className="in-person-sale-modal"
      eyebrow="VENTA PRESENCIAL"
      title="Registrar nueva venta"
      busy={saving}
      closeOnBackdrop={false}
      onClose={onClose}
    >
      <form className="in-person-sale-form in-person-sale-form-modal" onSubmit={onSubmit}>
        <div className="sale-form-grid">
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
            <input placeholder="+56 9 1234 5678" value={form.customer_phone} onChange={(event) => onFormChange('customer_phone', event.target.value)} />
          </label>
          <label className="field">
            <span>Método de pago</span>
            <select value={form.payment_method} onChange={(event) => onFormChange('payment_method', event.target.value)}>
              {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
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
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>{product.name} · {formatCurrency(product.price)} · stock {product.stock}</option>
                  ))}
                </select>
              </label>
              <label className="field sale-quantity">
                <span>Cantidad</span>
                <input required type="number" min="1" value={item.quantity} onChange={(event) => onItemChange(index, 'quantity', event.target.value)} />
              </label>
              <button className="icon-button icon-danger" type="button" title="Eliminar producto" aria-label="Eliminar producto" disabled={form.items.length === 1} onClick={() => onRemoveItem(index)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button className="button button-quiet" type="button" onClick={onAddItem}><Plus size={16} />Agregar producto</button>
        </div>

        <div className="modal-actions">
          <button className="button button-quiet" type="button" disabled={saving} onClick={onClose}>Cancelar</button>
          <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Registrando…' : 'Confirmar venta'}</button>
        </div>
      </form>
    </Modal>
  )
}
