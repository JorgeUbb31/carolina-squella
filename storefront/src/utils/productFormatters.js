export function getProductUnitLabel(unitType) {
  if (unitType === 'metro') return 'metro'
  if (unitType === 'unidad') return 'pieza'

  return unitType || 'pieza'
}

export function formatProductQuantity(quantity, unitType) {
  const amount = Number(quantity)
  const unit = getProductUnitLabel(unitType)

  if (unit === 'metro') return `${amount} ${amount === 1 ? 'metro' : 'metros'}`
  if (unit === 'pieza') return `${amount} ${amount === 1 ? 'pieza' : 'piezas'}`

  return `${amount} ${amount === 1 ? unit : `${unit}s`}`
}

export function formatRollWidth(widthCm) {
  if (!widthCm) return ''

  return `${(Number(widthCm) / 100).toLocaleString('es-CL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} m`
}
