import { useEffect, useState } from 'react'
import { AlertCircle, ArrowLeft, ArrowRight, LoaderCircle } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'
import { getQuoteRequests, updateQuoteRequestStatus } from '../services/quoteRequests.service'
import { getToken } from '../services/api'

const PAGE_SIZE = 20
const STATUS_LABELS = {
  pending: 'Pendiente',
  contacted: 'Contactada',
  closed: 'Cerrada',
}

function isAbortError(error) {
  return error?.name === 'AbortError'
}

export default function QuoteRequestsPage({ onSessionExpired }) {
  const [quotes, setQuotes] = useState([])
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    getQuoteRequests({ page: String(page), per_page: String(PAGE_SIZE), ...(status ? { status } : {}) }, {
      signal: controller.signal,
    })
      .then((result) => {
        setQuotes(result.data || [])
        setPagination({ current_page: result.current_page, last_page: result.last_page, total: result.total })
      })
      .catch((loadError) => {
        if (isAbortError(loadError)) return
        setError(loadError.message)
        if (!getToken()) onSessionExpired()
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [page, status, onSessionExpired])

  async function handleStatusChange(quote, nextStatus) {
    if (quote.status === 'closed') return

    setSavingId(quote.id)
    setError('')
    setNotice('')
    try {
      const updatedQuote = await updateQuoteRequestStatus(quote.id, nextStatus)
      setQuotes((currentQuotes) => currentQuotes.map((item) => (
        item.id === updatedQuote.id ? updatedQuote : item
      )))
      setNotice(`Cotización ${quote.number} actualizada.`)
    } catch (updateError) {
      setError(updateError.message)
      if (!getToken()) onSessionExpired()
    } finally {
      setSavingId(null)
    }
  }

  return (
    <>
      <div className="page-heading">
        <div><h1>Cotizaciones.</h1><p>Solicitudes recibidas desde la tienda.</p></div>
      </div>
      <section className="inventory-section">
        <div className="section-heading">
          <div><h2>Solicitudes</h2><span>{pagination.total} registros</span></div>
          <label className="quote-status-filter">
            Estado
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }}>
              <option value="">Todos</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>
        {error && <div className="inline-alert"><AlertCircle size={17} /><span>{error}</span></div>}
        {notice && <div className="inline-success">{notice}</div>}
        <div className="table-wrap">
          <table className="quotes-table">
            <thead>
              <tr><th>FOLIO</th><th>CLIENTE</th><th>FECHA</th><th>TOTAL REFERENCIAL</th><th>ESTADO</th></tr>
            </thead>
            <tbody>
              {loading && <tr><td className="table-state" colSpan="5"><LoaderCircle className="spin" size={20} />Cargando cotizaciones…</td></tr>}
              {!loading && quotes.map((quote) => (
                <tr key={quote.id}>
                  <td>
                    <details className="quote-detail">
                      <summary>{quote.number}</summary>
                      <div className="quote-detail-content">
                        <p><strong>Correo:</strong> <a href={`mailto:${quote.email}`}>{quote.email}</a></p>
                        {quote.phone && <p><strong>Teléfono:</strong> <a href={`tel:${quote.phone}`}>{quote.phone}</a></p>}
                        {quote.details && <p><strong>Detalles:</strong> {quote.details}</p>}
                        <ul>
                          {quote.items.map((item) => (
                            <li key={item.id}>
                              {item.product_name} · {item.quantity} {item.unit_type}
                              {' · '}{formatCurrency(item.unit_price)} c/u
                              {' · '}{formatCurrency(item.line_total)}
                            </li>
                          ))}
                        </ul>
                        <small>La solicitud no reserva stock. Verificar disponibilidad antes de confirmar.</small>
                      </div>
                    </details>
                  </td>
                  <td>{quote.name}</td>
                  <td>{new Date(quote.created_at).toLocaleDateString('es-CL')}</td>
                  <td className="price-cell">{formatCurrency(quote.total)}</td>
                  <td>
                    <select
                      aria-label={`Estado de ${quote.number}`}
                      disabled={savingId === quote.id || quote.status === 'closed'}
                      value={quote.status}
                      onChange={(event) => handleStatusChange(quote, event.target.value)}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {!loading && quotes.length === 0 && (
                <tr><td className="table-state empty-state" colSpan="5">No hay solicitudes para mostrar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <footer className="table-footer">
          <span>{pagination.total} solicitudes</span>
          <div className="pagination">
            <button className="icon-button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} aria-label="Página anterior"><ArrowLeft size={16} /></button>
            <span>Página <b>{pagination.current_page || 1}</b> de {pagination.last_page || 1}</span>
            <button className="icon-button" disabled={page >= pagination.last_page || loading} onClick={() => setPage((current) => current + 1)} aria-label="Página siguiente"><ArrowRight size={16} /></button>
          </div>
        </footer>
      </section>
    </>
  )
}
