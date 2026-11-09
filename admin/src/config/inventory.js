export const INVENTORY_PAGE_SIZE = 20
export const LOW_STOCK_THRESHOLD = 5
export const FABRIC_WIDTHS = [150, 250, 280]

export function isSoldByMeterCategory(category) {
  const categoryText = `${category?.slug || ''} ${category?.name || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  return ['tela', 'tapiceria', 'rollo', 'textil'].some((term) => categoryText.includes(term))
}

export function formatFabricWidth(widthCm) {
  return `${(Number(widthCm) / 100).toLocaleString('es-CL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} m`
}
