import { useEffect, useRef, useState } from 'react'
import { fetchAllProducts } from '../services/api'
import { formatPrice } from '../services/home.service'
import useQuoteRequest from '../hooks/useQuoteRequest'

export default function QuoteRequestSection({ open, onClose }) {
  const quoteSection = useRef(null)
  const nextItemId = useRef(1)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState('')
  const [items, setItems] = useState([{ id: 0, slug: '', quantity: 1 }])
  const { submitting, error, result, reset, submit } = useQuoteRequest()

  useEffect(() => {
    if (!open) return undefined

    let active = true
    quoteSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

  if (!open) return null

  const close = () => {
    reset()
    setItems([{ id: 0, slug: '', quantity: 1 }])
    onClose()
  }

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
              <p>Elige los productos y cantidades. Guardaremos tu solicitud y enviaremos la cotización en PDF al correo que ingreses.</p>
              <form className="quote-form" onSubmit={(event) => submit(event, items)}>
                <label>Nombre<input name="name" required maxLength="160" autoComplete="name" /></label>
                <label>Correo electrónico<input name="email" type="email" required maxLength="255" autoComplete="email" /></label>
                <label>Teléfono (opcional)<input name="phone" type="tel" maxLength="40" autoComplete="tel" /></label>
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
        </div>
      </div>
    </section>
  )
}
