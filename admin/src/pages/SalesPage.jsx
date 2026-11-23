import { useEffect, useState } from 'react'
import { AlertCircle, Plus, ReceiptText, ShoppingBag, Store } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'
import { getToken } from '../services/api'
import { getProducts } from '../services/products.service'
import { createInPersonSale, getSales } from '../services/sales.service'
import InPersonSaleModal from '../components/InPersonSaleModal'
import SalesTable from '../components/SalesTable'

function isAbortError(error) {
  return error?.name === 'AbortError'
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
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [form, setForm] = useState({
    customer_name: '',
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

  function updateItem(index, field, value) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index
        ? { ...item, [field]: value }
        : item),
    }))
  }

  function addItem() {
    setForm((current) => ({ ...current, items: [...current.items, { product_id: '', quantity: 1 }] }))
  }

  function removeItem(index) {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const payload = {
        ...form,
        items: form.items.map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
        })),
      }
      const result = await createInPersonSale(payload)
      setNotice(`Venta ${result.order.order_number} registrada.`)
      setSaleModalOpen(false)
      setForm({ customer_name: '', customer_email: '', customer_phone: '', payment_method: 'cash', items: [{ product_id: '', quantity: 1 }] })
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

  const paidOnlineSales = onlineSales.filter((sale) => sale.status === 'paid')
  const paidInPersonSales = inPersonSales.filter((sale) => sale.status === 'paid')
  const onlineTotal = paidOnlineSales.reduce((total, sale) => total + Number(sale.total || 0), 0)
  const inPersonTotal = paidInPersonSales.reduce((total, sale) => total + Number(sale.total || 0), 0)

  return (
    <>
      <div className="page-heading sales-page-heading">
        <div><h1>Ventas.</h1><p>Registro y seguimiento de ventas online y presenciales.</p></div>
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
            <button className="button button-primary" type="button" onClick={() => setSaleModalOpen(true)}><Plus size={16} />Nueva venta</button>
          </div>
          <SalesTable sales={inPersonSales} loading={inPersonLoading} />
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
        onClose={() => setSaleModalOpen(false)}
        onSubmit={handleSubmit}
        onFormChange={updateForm}
        onItemChange={updateItem}
        onAddItem={addItem}
        onRemoveItem={removeItem}
      />
    </>
  )
}
