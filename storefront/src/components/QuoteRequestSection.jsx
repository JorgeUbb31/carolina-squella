import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { fetchAllProducts } from '../services/api'
import { formatPrice } from '../services/home.service'
import useQuoteRequest from '../hooks/useQuoteRequest'
import { PHONE_COUNTRY_CODES } from '../utils/phone'

export default function QuoteRequestSection({ open, onClose }) {
  const quoteDialog = useRef(null)
  const nextItemId = useRef(1)
  const closeRef = useRef(null)
  const submittingRef = useRef(false)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState('')
  const [items, setItems] = useState([{ id: 0, slug: '', quantity: 1 }])
  const [reviewing, setReviewing] = useState(false)
  const [reviewData, setReviewData] = useState(null)
  const [phoneCode, setPhoneCode] = useState('+56')
  const [phoneNumber, setPhoneNumber] = useState('')
  const { submitting, error, result, reset, submit } = useQuoteRequest()

  useEffect(() => {
    submittingRef.current = submitting
  }, [submitting])

  const close = () => {
    if (submitting) return
    reset()
    setItems([{ id: 0, slug: '', quantity: 1 }])
    setReviewing(false)
    setReviewData(null)
    setPhoneCode('+56')
    setPhoneNumber('')
    nextItemId.current = 1
    onClose()
  }

  useEffect(() => {
    closeRef.current = close
  })

  useEffect(() => {
    if (!open) return undefined

    let active = true
    setProductsLoading(true)
    setProductsError('')
    fetchAllProducts()
      .then((loadedProducts) => {
        if (active) setProducts(loadedProducts)
      })
      .catch((loadError) => {
        if (active) setProductsError(loadError.message)
      })
      .finally(() => {
        if (active) setProductsLoading(false)
      })

    return () => {
      active = false
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    const dialog = quoteDialog.current
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const focusableElements = () => [...(dialog?.querySelectorAll(focusableSelector) || [])]
    const initialFocus = dialog?.querySelector('input:not([disabled]), select:not([disabled]), textarea:not([disabled])')
    initialFocus?.focus()
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !submittingRef.current) {
        event.preventDefault()
        closeRef.current?.()
        return
      }

      if (event.key !== 'Tab') return
      const elements = focusableElements()
      if (elements.length === 0) {
        event.preventDefault()
        dialog?.focus()
        return
      }

      const first = elements[0]
      const last = elements[elements.length - 1]
      if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [open])

  if (!open) return null

  const updateItem = (id, field, value) => {
    setItems((currentItems) => currentItems.map((item) => (
      item.id === id ? { ...item, [field]: value } : item
    )))
  }

  const addItem = () => {
    setItems((currentItems) => [
      ...currentItems,
      { id: nextItemId.current++, slug: '', quantity: 1 },
    ])
  }

  const total = items.reduce((sum, item) => {
    const product = products.find((candidate) => candidate.slug === item.slug)
    return sum + (Number(product?.price || 0) * Number(item.quantity || 0))
  }, 0)

  const reviewQuote = (event) => {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget))
    data.phone = phoneNumber ? `${phoneCode} ${phoneNumber}`.trim() : ''
    setReviewData(data)
    setReviewing(true)
  }

  return createPortal(
    <div
      className="quote-modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && !submitting && close()}
    >
      <section
        className="quote-card quote-dialog"
        id="solicitar-cotizacion"
        ref={quoteDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-dialog-title"
        tabIndex="-1"
      >
        <div className="section-title quote-dialog-titlebar">
          <h2 id="quote-dialog-title">Solicita una cotización</h2>
          <button className="quote-close-button" type="button" onClick={close} disabled={submitting} aria-label="Cerrar cotización">
            <span aria-hidden="true">×</span>
          </button>
        </div>
        {result ? (
          <div role="status">
            <p>{result}</p>
            <button className="primary-btn" type="button" onClick={close}>Listo</button>
          </div>
        ) : reviewing ? (
          <div className="quote-review">
            <p>Revisa que tus datos sean correctos antes de enviar la solicitud.</p>
            <dl className="quote-review-data">
              <div><dt>Nombre</dt><dd>{reviewData.name}</dd></div>
              <div><dt>Correo</dt><dd>{reviewData.email}</dd></div>
              {reviewData.phone && <div><dt>Teléfono</dt><dd>{reviewData.phone}</dd></div>}
            </dl>
            {reviewData.details && <div className="quote-review-details"><strong>Detalles adicionales</strong><p>{reviewData.details}</p></div>}
            <ul className="quote-review-items">
              {items.map((item) => {
                const product = products.find((candidate) => candidate.slug === item.slug)
                return (
                  <li key={item.id}>
                    <span>{product?.name || item.slug} × {item.quantity}</span>
                    <strong>{formatPrice(Number(product?.price || 0) * Number(item.quantity || 0))}</strong>
                  </li>
                )
              })}
            </ul>
            <p className="quote-estimate">Total referencial: <strong>{formatPrice(total)}</strong></p>
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="quote-review-actions">
              <button className="secondary-btn" type="button" disabled={submitting} onClick={() => setReviewing(false)}>Volver y editar</button>
              <button className="primary-btn" type="button" disabled={submitting} onClick={() => submit(items, reviewData)}>
                {submitting ? 'Enviando...' : 'Confirmar y solicitar'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p>Elige los productos y cantidades. Guardaremos tu solicitud y enviaremos la cotización en PDF al correo que ingreses.</p>
            <form className="quote-form" onSubmit={reviewQuote}>
              <label>Nombre<input name="name" required maxLength="160" autoComplete="name" /></label>
              <label>Correo electrónico<input name="email" type="email" required maxLength="255" autoComplete="email" /></label>
              <label>Teléfono (opcional)
                <span className="phone-input-group">
                  <select aria-label="Prefijo telefónico" value={phoneCode} onChange={(event) => setPhoneCode(event.target.value)}>
                    {PHONE_COUNTRY_CODES.map(({ code, country }) => (
                      <option key={`${country}-${code}`} value={code} title={`${country} (${code})`}>{code}</option>
                    ))}
                  </select>
                  <input type="tel" maxLength="40" inputMode="tel" autoComplete="tel" placeholder="9 1234 5678" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
                </span>
              </label>
              <fieldset className="quote-items">
                <legend>Productos</legend>
                {productsLoading && <p>Cargando productos...</p>}
                {productsError && <p className="form-error" role="alert">{productsError}</p>}
                {!productsLoading && !productsError && items.map((item, index) => (
                  <div className="quote-item-row" key={item.id}>
                    <label>Producto
                      <select
                        required
                        value={item.slug}
                        onChange={(event) => updateItem(item.id, 'slug', event.target.value)}
                      >
                        <option value="">Selecciona un producto</option>
                        {products.map((product) => (
                          <option
                            key={product.slug}
                            value={product.slug}
                            disabled={items.some((selected, selectedIndex) => (
                              selectedIndex !== index && selected.slug === product.slug
                            ))}
                          >
                            {product.name} · {formatPrice(product.price)} / {product.unit_type}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>Cantidad
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        required
                        value={item.quantity}
                        onChange={(event) => updateItem(item.id, 'quantity', event.target.value)}
                      />
                    </label>
                    {items.length > 1 && (
                      <button
                        className="secondary-btn quote-item-remove"
                        type="button"
                        aria-label="Quitar producto"
                        onClick={() => setItems((currentItems) => currentItems.filter(({ id }) => id !== item.id))}
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                ))}
                {!productsLoading && !productsError && (
                  <button className="secondary-btn" type="button" onClick={addItem} disabled={items.length >= 50}>
                    Agregar otro producto
                  </button>
                )}
                <p className="quote-estimate">Total referencial: <strong>{formatPrice(total)}</strong></p>
                <small>El precio definitivo y la disponibilidad se confirmarán al revisar la solicitud. Esta solicitud no reserva stock.</small>
              </fieldset>
              <label>Detalles adicionales (opcional)<textarea name="details" maxLength="2000" rows="4" /></label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="primary-btn" type="submit" disabled={submitting || productsLoading || products.length === 0}>
                {submitting ? 'Enviando...' : 'Solicitar cotización PDF'}
              </button>
            </form>
          </>
        )}
      </section>
    </div>,
    document.body
  )
}
