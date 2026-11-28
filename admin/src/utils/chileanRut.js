export function normalizeChileanRut(value = '') {
  return String(value).replace(/[^0-9k]/gi, '').toUpperCase()
}

export function isValidChileanRut(value) {
  const normalized = normalizeChileanRut(value)
  if (!/^\d{7,8}[0-9K]$/.test(normalized)) return false

  const body = normalized.slice(0, -1)
  let sum = 0
  let factor = 2

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * factor
    factor = factor === 7 ? 2 : factor + 1
  }

  const remainder = 11 - (sum % 11)
  const expectedDigit = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder)
  return normalized.at(-1) === expectedDigit
}

export function formatChileanRut(value) {
  const normalized = normalizeChileanRut(value)
  if (normalized.length < 2) return normalized

  const body = normalized.slice(0, -1)
  const verifier = normalized.at(-1)
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${verifier}`
}
