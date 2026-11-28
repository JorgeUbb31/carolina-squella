import { Check, FileText, LoaderCircle, Save } from 'lucide-react'
import InventoryControlCharts from './InventoryControlCharts'
import { formatInventoryControlDate } from '../utils/inventoryControls'

export default function InventoryControlDetail({
  control,
  summary,
  countDrafts,
  savingItemId,
  completing,
  onComplete,
  onOpenReport,
  onDraftChange,
  onSaveCount,
}) {
  const isEditable = control.status === 'in_progress'

  return (
    <section className="inventory-section inventory-control-detail">
      <div className="section-heading inventory-control-heading">
        <div>
          <h2>{control.number}</h2>
          <span>Iniciado {formatInventoryControlDate(control.started_at)}</span>
        </div>
        {control.status === 'completed'
          ? <button className="button button-quiet" type="button" onClick={() => onOpenReport(control.id)}><FileText size={16} />Ver informe</button>
          : <button className="button button-primary" type="button" disabled={completing || summary.pending > 0 || control.items.length === 0} onClick={onComplete}><Check size={16} />{completing ? 'Confirmando…' : 'Confirmar control'}</button>}
      </div>

      <InventoryControlCharts summary={summary} />

      <div className="table-wrap inventory-control-table-wrap">
        <table className="inventory-control-table">
          <thead>
            <tr><th>PRODUCTO</th><th>CATEGORÍA</th><th>INICIO</th><th>ESPERADO</th><th>CONTEO FÍSICO</th><th>DIFERENCIA</th><th>ACCIÓN</th></tr>
          </thead>
          <tbody>
            {control.items.map((item) => {
              const difference = item.difference
              return (
                <tr key={item.id}>
                  <td><strong>{item.product_name}</strong><small>{item.unit_type}</small></td>
                  <td>{item.category_name || 'Sin categoría'}</td>
                  <td>{item.system_stock_snapshot}</td>
                  <td>{item.expected_stock ?? '—'}</td>
                  <td>
                    <input
                      className="inventory-count-input"
                      type="number"
                      min="0"
                      placeholder="Ej.: 12"
                      aria-label={`Conteo físico de ${item.product_name}`}
                      disabled={!isEditable || savingItemId === item.id}
                      value={countDrafts[item.id] ?? ''}
                      onChange={(event) => onDraftChange(item.id, event.target.value)}
                    />
                  </td>
                  <td className={difference < 0 ? 'inventory-difference-negative' : difference > 0 ? 'inventory-difference-positive' : 'inventory-difference-zero'}>
                    {difference === null || difference === undefined ? '—' : `${difference > 0 ? '+' : ''}${difference}`}
                  </td>
                  <td>
                    {isEditable && (
                      <button
                        className="icon-button"
                        type="button"
                        title="Guardar conteo"
                        aria-label={`Guardar conteo de ${item.product_name}`}
                        disabled={savingItemId === item.id || countDrafts[item.id] === '' || countDrafts[item.id] === undefined}
                        onClick={() => onSaveCount(item)}
                      >
                        {savingItemId === item.id ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}
                      </button>
                    )}
                    {!isEditable && <span className="inventory-count-saved">Guardado</span>}
                  </td>
                </tr>
              )
            })}
            {control.items.length === 0 && <tr><td className="table-state empty-state" colSpan="7">No hay productos incluidos en este control.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}