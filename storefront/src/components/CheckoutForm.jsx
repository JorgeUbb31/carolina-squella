import { CHILE_REGIONS } from '../data/chileLocations'

export default function CheckoutForm({ form, onChange, error, submitting, disabled, onSubmit }) {
  const selectedRegion = CHILE_REGIONS.find((region) => region.name === form.delivery_region)

  return (
    <form className="checkout-form" onSubmit={onSubmit}>
      <fieldset className="payment-options">
        <legend>Método de pago</legend>
        <label>
          <input
            type="radio"
            name="payment_method"
            value="webpay_plus"
            checked={form.payment_method === 'webpay_plus'}
            onChange={(event) => onChange('payment_method', event.target.value)}
          />
          Webpay Plus
          <small>Tarjetas y otros medios disponibles en Transbank. Autorizarás el pago en su sitio seguro.</small>
        </label>
        <label>
          <input
            type="radio"
            name="payment_method"
            value="bank_transfer"
            checked={form.payment_method === 'bank_transfer'}
            onChange={(event) => onChange('payment_method', event.target.value)}
          />
          Transferencia bancaria
          <small>Te contactaremos para coordinar el pago después de registrar el pedido.</small>
        </label>
      </fieldset>
      <label>Nombre completo<input required maxLength="160" autoComplete="name" value={form.customer_name} onChange={(event) => onChange('customer_name', event.target.value)} /></label>
      <label>Correo electrónico<input required type="email" maxLength="255" autoComplete="email" value={form.customer_email} onChange={(event) => onChange('customer_email', event.target.value)} /></label>
      <label>Teléfono<input required type="tel" maxLength="40" autoComplete="tel" value={form.customer_phone} onChange={(event) => onChange('customer_phone', event.target.value)} /></label>
      <label>Dirección<input required maxLength="255" autoComplete="street-address" value={form.delivery_address} onChange={(event) => onChange('delivery_address', event.target.value)} /></label>
      <div className="form-row">
        <label>Región
          <select
            name="delivery_region"
            autoComplete="address-level1"
            required
            value={form.delivery_region}
            onChange={(event) => {
              onChange('delivery_region', event.target.value)
              onChange('delivery_city', '')
            }}
          >
            <option value="">Selecciona una región</option>
            {CHILE_REGIONS.map((region) => <option key={region.name} value={region.name}>{region.name}</option>)}
          </select>
        </label>
        <label>Comuna
          <select
            name="delivery_city"
            autoComplete="address-level2"
            required
            disabled={!selectedRegion}
            value={form.delivery_city}
            onChange={(event) => onChange('delivery_city', event.target.value)}
          >
            <option value="">{selectedRegion ? 'Selecciona una comuna' : 'Primero selecciona una región'}</option>
            {selectedRegion?.communes.map((commune) => <option key={commune} value={commune}>{commune}</option>)}
          </select>
        </label>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-btn checkout-submit" type="submit" disabled={submitting || disabled}>
        {submitting ? 'Registrando pedido...' : 'Confirmar pedido'}
      </button>
      <small>{form.payment_method === 'webpay_plus' ? 'Serás redirigido a Transbank para autorizar el pago de forma segura.' : 'El pedido quedará pendiente de pago. No se realizará ningún cobro en línea.'}</small>
    </form>
  )
}
