import { ClipboardCheck } from 'lucide-react'
import { formatInventoryControlDate } from '../utils/inventoryControls'

export default function InventoryControlHistory({ controls, selectedControlId, onSelect }) {
  return (
    <section className="inventory-section inventory-control-history">
      <div className="section-heading">
        <div><h2>Historial</h2><span>{controls.length} controles recientes</span></div>
      </div>
      <div className="inventory-control-list">
        {controls.map((control) => (
          <button
            className={`inventory-control-list-item ${selectedControlId === control.id ? 'inventory-control-list-active' : ''}`}
            type="button"
            key={control.id}
            onClick={() => onSelect(control.id)}
          >
            <span className="inventory-control-list-icon"><ClipboardCheck size={16} /></span>
            <span className="inventory-control-list-copy">
              <strong>{control.number}</strong>
              <small>{formatInventoryControlDate(control.started_at)}</small>
              <small>{control.counted_items} de {control.total_items} productos contados</small>
            </span>
            <span className={`inventory-control-status inventory-control-status-${control.status}`}>
              {control.status === 'completed' ? 'Finalizado' : 'En curso'}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}