export const SHIPPING_CARRIERS = [
  { value: 'starken', label: 'Starken' },
  { value: 'chilexpress', label: 'Chilexpress' },
  { value: 'correos_chile', label: 'Correos de Chile' },
  { value: 'blue_express', label: 'Blue Express' },
]

export function getShippingCarrierLabel(value) {
  return SHIPPING_CARRIERS.find((carrier) => carrier.value === value)?.label || value
}
