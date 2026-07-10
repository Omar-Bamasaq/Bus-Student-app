const numberFormatter = new Intl.NumberFormat('ar-YE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})
const currencySymbol = '﷼'

export function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return ''
  const number = Number(value)
  if (Number.isNaN(number)) return String(value)
  return `${numberFormatter.format(number)} ${currencySymbol}`
}
