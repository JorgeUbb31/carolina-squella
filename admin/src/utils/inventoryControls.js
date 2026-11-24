export function formatInventoryControlDate(value) {
  return value ? new Date(value).toLocaleString('es-CL') : '—'
}

export function getInventoryControlSummary(items = []) {
  return items.reduce((summary, item) => {
    if (item.counted_stock === null || item.counted_stock === undefined) {
      summary.pending += 1
      return summary
    }

    if (Number(item.difference) === 0) {
      summary.matched += 1
    } else if (Number(item.difference) < 0) {
      summary.shortages += 1
    } else {
      summary.surpluses += 1
    }

    summary.expected += Number(item.expected_stock ?? item.system_stock_snapshot ?? 0)
    summary.counted += Number(item.counted_stock)
    return summary
  }, { pending: 0, matched: 0, shortages: 0, surpluses: 0, expected: 0, counted: 0 })
}