import { LoaderCircle, Pencil } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'

const PAYMENT_LABELS = {
  cash: 'Efectivo',
  bank_transfer: 'Transferencia',
  debit_card: 'Tarjeta de débito',
  credit_card: 'Tarjeta de crédito',
  webpay_plus: 'Webpay Plus',
}

const STATUS_LABELS = {
  paid: 'Pagada',
  pending_payment: 'Pendiente',
  payment_cancelled: 'Cancelada',
  payment_failed: 'Fallida',
  expired: 'Expirada',
}

export default function SalesTable({ sales, loading, onEditSale }) {
  return (
    <div className="table-wrap">
      <table className="sales-table"> 
        <thead>
          <tr>
            <th>VENTA</th>
            <th>CLIENTE</th>
            <th>FECHA</th>
            <th>PAGO</th>
            <th>ESTADO</th>
            <th>TOTAL</th>
            {onEditSale && <th><span className="sr-only">Acciones</span></th>}
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td className="table-state" colSpan={onEditSale ? 7 : 6}>
                <LoaderCircle className="spin" size={20} />Cargando ventas…
              </td>
            </tr>
          )}
          {!loading && sales.map((sale) => (
            <tr key={sale.id}>
              <td>
                <details className="sale-detail">
                  <summary>{sale.order_number}</summary>
                  <div className="sale-detail-content">
                    <ul>
                      {sale.items.map((item) => (
                        <li key={item.id}>{item.product_name} · {item.quantity} × {formatCurrency(item.unit_price)}</li>
                      ))}
                    </ul>
                  </div>
                </details>
              </td>
              <td><span className="sales-customer-name">{sale.customer_name}</span>{sale.customer_rut && <small className="sales-customer-rut">{sale.customer_rut}</small>}</td>
              <td>{new Date(sale.created_at).toLocaleDateString('es-CL')}</td>
              <td><span className="sale-payment">{PAYMENT_LABELS[sale.payment_method] || sale.payment_method}</span></td>
              <td><span className={`sale-status sale-status-${sale.status || 'paid'}`}>{STATUS_LABELS[sale.status] || 'Pagada'}</span></td>
              <td className="price-cell">{formatCurrency(sale.total)}</td>
              {onEditSale && <td><button className="icon-button" type="button" title="Editar venta presencial" aria-label={`Editar venta ${sale.order_number}`} onClick={() => onEditSale(sale)}><Pencil size={16} /></button></td>}
            </tr>
          ))}
          {!loading && sales.length === 0 && (
            <tr>
              <td className="table-state empty-state" colSpan={onEditSale ? 7 : 6}>No hay ventas para mostrar.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
