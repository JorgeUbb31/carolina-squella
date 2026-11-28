export const PHONE_COUNTRY_CODES = [
  { code: '+56', country: 'Chile' },
  { code: '+54', country: 'Argentina' },
  { code: '+591', country: 'Bolivia' },
  { code: '+55', country: 'Brasil' },
  { code: '+57', country: 'Colombia' },
  { code: '+506', country: 'Costa Rica' },
  { code: '+593', country: 'Ecuador' },
  { code: '+34', country: 'España' },
  { code: '+1', country: 'Estados Unidos / Canadá' },
  { code: '+52', country: 'México' },
  { code: '+595', country: 'Paraguay' },
  { code: '+51', country: 'Perú' },
  { code: '+598', country: 'Uruguay' },
]

export function parsePhone(phone = '') {
  const cleanPhone = String(phone).trim()
  const country = PHONE_COUNTRY_CODES.find(({ code }) => cleanPhone.startsWith(code))

  if (!country) {
    return { code: '+56', number: cleanPhone.replace(/^\+?56\s*/, '') }
  }

  return {
    code: country.code,
    number: cleanPhone.slice(country.code.length).trim(),
  }
}
