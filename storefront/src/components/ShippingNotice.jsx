import { createPortal } from 'react-dom'

export default function ShippingNotice({ onCancel, onConfirm, submitting = false }) {
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') onCancel()
  }

  return createPortal(
    <div className="shipping-notice-backdrop" onKeyDown={handleKeyDown}>
      <section
        className="shipping-notice"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="shipping-notice-title"
        aria-describedby="shipping-notice-description"
        tabIndex="-1"
      >
        <span className="eyebrow">Importante</span>
        <h2 id="shipping-notice-title">El envío no está incluido</h2>
        <p id="shipping-notice-description">
          El costo del despacho no está cubierto por la tienda y debe pagarlo quien recibe la compra. Te informaremos el valor antes de coordinar el envío. Al continuar, registraremos el pedido como pendiente de pago; no se realizará ningún cobro en línea.
        </p>
        <div className="shipping-notice-actions">
          <button className="secondary-btn" type="button" autoFocus onClick={onCancel}>Volver</button>
          <button className="primary-btn" type="button" disabled={submitting} onClick={onConfirm}>Entiendo, continuar</button>
        </div>
      </section>
    </div>,
    document.body
  )
}