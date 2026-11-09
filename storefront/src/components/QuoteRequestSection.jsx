import { useEffect, useRef } from 'react'
import useQuoteRequest from '../hooks/useQuoteRequest'

export default function QuoteRequestSection({ open, onClose }) {
  const quoteSection = useRef(null)
  const { submitting, error, result, reset, submit } = useQuoteRequest()

  useEffect(() => {
    if (open) {
      quoteSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [open])

  if (!open) return null

  const close = () => {
    reset()
    onClose()
  }

  return (
    <section className="section quote-section" id="solicitar-cotizacion" ref={quoteSection}>
      <div className="container">
        <div className="quote-card">
          <div className="section-title">
            <h2>Solicita una cotización</h2>
            <button className="secondary-btn" type="button" onClick={close}>Cerrar</button>
          </div>
          {result ? (
            <div role="status">
              <p>{result}</p>
              <button className="primary-btn" type="button" onClick={close}>Listo</button>
            </div>
          ) : (
            <>
              <p>Cuéntanos qué necesitas. Guardaremos tu solicitud y enviaremos una confirmación al correo que ingreses.</p>
              <form className="quote-form" onSubmit={submit}>
                <label>Nombre<input name="name" required maxLength="160" autoComplete="name" /></label>
                <label>Correo electrónico<input name="email" type="email" required maxLength="255" autoComplete="email" /></label>
                <label>Teléfono (opcional)<input name="phone" type="tel" maxLength="40" autoComplete="tel" /></label>
                <label>¿Qué necesitas cotizar?<textarea name="details" required maxLength="2000" rows="4" /></label>
                {error && <p className="form-error" role="alert">{error}</p>}
                <button className="primary-btn" type="submit" disabled={submitting}>
                  {submitting ? 'Enviando...' : 'Enviar solicitud'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
