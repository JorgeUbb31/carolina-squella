import { useEffect, useState } from 'react'
import { AlertCircle, FileDown, Plus, ReceiptText, ShoppingBag, Store } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'
import { getToken } from '../services/api'
import { getProducts } from '../services/products.service'
import { createInPersonSale, getCustomerByRut, getMonthlySalesReport, getSales, updateInPersonSale } from '../services/sales.service'
import InPersonSaleModal from '../components/InPersonSaleModal'
import SalesTable from '../components/SalesTable'
import { formatChileanRut, isValidChileanRut, normalizeChileanRut } from '../utils/chileanRut'

function isAbortError(error) {
  return error?.name === 'AbortError'
}

function currentMonth() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

export default function SalesPage({ onSessionExpired }) {
  const [onlineSales, setOnlineSales] = useState([])
  const [inPersonSales, setInPersonSales] = useState([])
  const [products, setProducts] = useState([])
  const [onlineLoading, setOnlineLoading] = useState(true)
  const [inPersonLoading, setInPersonLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [activeView, setActiveView] = useState('online')
  const [reportMonth, setReportMonth] = useState(currentMonth)
  const [reportGenerating, setReportGenerating] = useState(false)
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [editingSale, setEditingSale] = useState(null)
  const [lookupStatus, setLookupStatus] = useState('')
  const [form, setForm] = useState({
    customer_name: '',
    customer_rut: '',
    customer_email: '',
    customer_phone: '',
    payment_method: 'cash',
    items: [{ product_id: '', quantity: 1 }],
  })

  async function loadSales(source, setter, setLoading) {
    try {
      setLoading(true)
      const result = await getSales({ sale_source: source, per_page: '50' })
      setter(result.data || [])
    } catch (loadError) {
      setError(loadError.message)
      if (!getToken()) onSessionExpired()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()

    getSales({ sale_source: 'online', per_page: '50' }, { signal: controller.signal })
      .then((online) => {
        setOnlineSales(online.data || [])
        setOnlineLoading(false)
      })
      .catch((loadError) => {
        if (isAbortError(loadError)) return
        setError(loadError.message)
        setOnlineLoading(false)
        if (!getToken()) onSessionExpired()
      })

    Promise.all([
      getSales({ sale_source: 'in_person', per_page: '50' }, { signal: controller.signal }),
      getProducts({ per_page: '100' }, { signal: controller.signal }),
    ]).then(([inPerson, productResult]) => {
      setInPersonSales(inPerson.data || [])
      setProducts((productResult.data || []).filter((product) => product.is_active))
    }).catch((loadError) => {
      if (isAbortError(loadError)) return
      setError(loadError.message)
      if (!getToken()) onSessionExpired()
    }).finally(() => {
      if (!controller.signal.aborted) setInPersonLoading(false)
    })

    return () => controller.abort()
  }, [onSessionExpired])

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function resetSaleForm() {
    setForm({
      customer_name: '',
      customer_rut: '',
      customer_email: '',
      customer_phone: '',
      payment_method: 'cash',
      items: [{ product_id: '', quantity: 1, unit_price: null }],
    })
    setEditingSale(null)
    setLookupStatus('')
    setError('')
  }

  function handleNewSale() {
    resetSaleForm()
    setSaleModalOpen(true)
  }

  function handleEditSale(sale) {
    setEditingSale(sale)
    setLookupStatus('')
    setError('')
    setForm({
      customer_name: sale.customer_name || '',
      customer_rut: sale.customer_rut ? formatChileanRut(sale.customer_rut) : '',
      customer_email: sale.customer_email || '',
      customer_phone: sale.customer_phone || '',
      payment_method: sale.payment_method || 'cash',
      items: sale.items.map((item) => ({
        product_id: item.product_id ? String(item.product_id) : '',
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    })
    setSaleModalOpen(true)
  }

  async function handleRutBlur() {
    const rut = normalizeChileanRut(form.customer_rut)
    if (!rut) {
      setLookupStatus('')
      return
    }
    if (!isValidChileanRut(rut)) {
      setLookupStatus('RUT no válido. Revisa el número y dígito verificador.')
      return
    }

    setForm((current) => ({ ...current, customer_rut: formatChileanRut(rut) }))
    setLookupStatus('Buscando cliente…')
    try {
      const { customer } = await getCustomerByRut(rut)
      if (!customer) {
        setLookupStatus('RUT válido. No hay ventas anteriores de este cliente.')
        return
      }

      setForm((current) => ({
        ...current,
        customer_name: customer.customer_name || current.customer_name,
        customer_email: customer.customer_email || '',
        customer_phone: customer.customer_phone || '',
      }))
      setLookupStatus('Cliente encontrado; completamos sus datos anteriores.')
    } catch (lookupError) {
      setLookupStatus(lookupError.message)
      if (!getToken()) onSessionExpired()
    }
  }

  function updateItem(index, field, value) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index
        ? {
          ...item,
          [field]: value,
          ...(field === 'product_id'
            ? { unit_price: Number(products.find((product) => Number(product.id) === Number(value))?.price || 0) }
            : {}),
        }
        : item),
    }))
  }

  function addItem() {
    setForm((current) => ({ ...current, items: [...current.items, { product_id: '', quantity: 1, unit_price: null }] }))
  }

  function removeItem(index) {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  async function handleSubmit() {
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const payload = {
        ...form,
        customer_rut: normalizeChileanRut(form.customer_rut),
        items: form.items.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
        })),
      }
      const result = editingSale
        ? await updateInPersonSale(editingSale.id, payload)
        : await createInPersonSale(payload)
      setNotice(editingSale
        ? `Venta ${result.order.order_number} corregida.`
        : `Venta ${result.order.order_number} registrada.`)
      setSaleModalOpen(false)
      resetSaleForm()
      await Promise.all([
        loadSales('in_person', setInPersonSales, setInPersonLoading),
        loadSales('online', setOnlineSales, setOnlineLoading),
      ])
    } catch (saveError) {
      setError(saveError.message)
      if (!getToken()) onSessionExpired()
    } finally {
      setSaving(false)
    }
  }

  async function handleMonthlyReport() {
    const reportWindow = window.open('', '_blank')
    if (!reportWindow) {
      setError('El navegador bloqueó la nueva pestaña. Permite ventanas emergentes para ver el informe.')
      return
    }

    reportWindow.document.title = 'Preparando informe de ventas'
    reportWindow.document.body.textContent = 'Preparando informe…'
    setReportGenerating(true)
    setError('')
    try {
      const pdf = await getMonthlySalesReport(reportMonth)
      reportWindow.location.href = URL.createObjectURL(pdf)
    } catch (reportError) {
      reportWindow.close()
      setError(reportError.message)
      if (!getToken()) onSessionExpired()
    } finally {
      setReportGenerating(false)
    }
  }

  const paidOnlineSales = onlineSales.filter((sale) => sale.status === 'paid')
  const paidInPersonSales = inPersonSales.filter((sale) => sale.status === 'paid')
  const onlineTotal = paidOnlineSales.reduce((total, sale) => total + Number(sale.total || 0), 0)
  const inPersonTotal = paidInPersonSales.reduce((total, sale) => total + Number(sale.total || 0), 0)

  return (
    <>
      <div className="page-heading sales-page-heading">
        <div><h1>Ventas.</h1><p>Registro y seguimiento de ventas online y presenciales.</p></div>
        <div className="sales-report-controls">
          <label className="field">Mes del informe
            <input type="month" value={reportMonth} onChange={(event) => setReportMonth(event.target.value)} />
          </label>
          <button className="button button-primary" type="button" disabled={!reportMonth || reportGenerating} onClick={handleMonthlyReport}>
            <FileDown size={16} />{reportGenerating ? 'Generando…' : 'Informe PDF'}
          </button>
        </div>
      </div>
      {error && <div className="inline-alert"><AlertCircle size={17} /><span>{error}</span></div>}
      {notice && <div className="inline-success">{notice}</div>}

      <div className="sales-overview" aria-label="Resumen de ventas">
        <div className="sales-stat"><span className="sales-stat-icon"><Store size={18} /></span><div><span>Ganado presencial</span><strong>{formatCurrency(inPersonTotal)}</strong><small>{paidInPersonSales.length} ventas pagadas</small></div></div>
        <div className="sales-stat"><span className="sales-stat-icon"><ShoppingBag size={18} /></span><div><span>Ganado online</span><strong>{formatCurrency(onlineTotal)}</strong><small>{paidOnlineSales.length} ventas pagadas</small></div></div>
        <div className="sales-stat"><span className="sales-stat-icon"><ReceiptText size={18} /></span><div><span>Total ganado</span><strong>{formatCurrency(inPersonTotal + onlineTotal)}</strong><small>{paidInPersonSales.length + paidOnlineSales.length} ventas pagadas</small></div></div>
      </div>

      <div className="sales-tabs" role="tablist" aria-label="Tipo de venta">
        <button className={`sales-tab ${activeView === 'in_person' ? 'sales-tab-active' : ''}`} type="button" role="tab" aria-selected={activeView === 'in_person'} onClick={() => setActiveView('in_person')}><Store size={18} /><span><strong>Ventas presenciales</strong><small>{inPersonSales.length} registros</small></span></button>
        <button className={`sales-tab ${activeView === 'online' ? 'sales-tab-active' : ''}`} type="button" role="tab" aria-selected={activeView === 'online'} onClick={() => setActiveView('online')}><ShoppingBag size={18} /><span><strong>Ventas online</strong><small>{onlineSales.length} registros</small></span></button>
      </div>

      {activeView === 'in_person' ? (
        <section className="sales-view" role="tabpanel" aria-label="Ventas presenciales">
          <div className="in-person-sale-toolbar">
            <div><strong>Ventas registradas en tienda</strong><span>{inPersonSales.length} registros</span></div>
            <button className="button button-primary" type="button" onClick={handleNewSale}><Plus size={16} />Nueva venta</button>
          </div>
          <SalesTable sales={inPersonSales} loading={inPersonLoading} onEditSale={handleEditSale} />
        </section>
      ) : (
        <section className="sales-view" role="tabpanel" aria-label="Ventas online">
          <SalesTable sales={onlineSales} loading={onlineLoading} />
        </section>
      )}

      <InPersonSaleModal
        open={saleModalOpen}
        form={form}
        products={products}
        saving={saving}
        error={error}
        lookupStatus={lookupStatus}
        editing={Boolean(editingSale)}
        onClose={() => { setSaleModalOpen(false); resetSaleForm() }}
        onSubmit={handleSubmit}
        onFormChange={updateForm}
        onItemChange={updateItem}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onRutBlur={handleRutBlur}
      />
    </>
  )
}
