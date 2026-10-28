const vnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

export function formatVnd(amount: number): string {
  return vnd.format(amount)
}

export function formatBudgetRange(min: number, max: number): string {
  if (min === max) return formatVnd(min)
  return `${formatVnd(min)} – ${formatVnd(max)}`
}
