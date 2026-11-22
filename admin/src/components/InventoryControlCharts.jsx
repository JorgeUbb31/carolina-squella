export default function InventoryControlCharts({ summary }) {
  const maxCount = Math.max(1, summary.matched, summary.shortages, summary.surpluses)
  const maxStock = Math.max(1, summary.expected, summary.counted)
  const comparison = [
    { label: 'Esperado en productos contados', value: summary.expected, className: 'inventory-chart-expected' },
    { label: 'Conteo físico guardado', value: summary.counted, className: 'inventory-chart-counted' },
  ]
  const results = [
    { label: 'Coinciden', value: summary.matched, className: 'inventory-chart-matched' },
    { label: 'Faltantes', value: summary.shortages, className: 'inventory-chart-shortage' },
    { label: 'Sobrantes', value: summary.surpluses, className: 'inventory-chart-surplus' },
  ]

  return (
    <div className="inventory-control-charts">
      <section className="inventory-chart-panel">
        <h3>Unidades</h3>
        {comparison.map((row) => (
          <div className="inventory-chart-row" key={row.label}>
            <div><span>{row.label}</span><strong>{row.value}</strong></div>
            <div className="inventory-chart-track"><i className={row.className} style={{ width: `${(row.value / maxStock) * 100}%` }} /></div>
          </div>
        ))}
      </section>
      <section className="inventory-chart-panel">
        <h3>Resultado por productos</h3>
        {results.map((row) => (
          <div className="inventory-chart-row" key={row.label}>
            <div><span>{row.label}</span><strong>{row.value}</strong></div>
            <div className="inventory-chart-track"><i className={row.className} style={{ width: `${(row.value / maxCount) * 100}%` }} /></div>
          </div>
        ))}
        {summary.pending > 0 && <small className="inventory-chart-pending">{summary.pending} productos pendientes de contar</small>}
      </section>
    </div>
  )
}