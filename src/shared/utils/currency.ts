/**
 * Format a number as Vietnamese Dong (VND).
 * e.g. 150000 → "150.000đ"
 */
export function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format a budget range, e.g. 200000-500000 → "200k – 500k"
 */
export function formatBudgetRange(min?: number, max?: number): string {
  if (!min && !max) return ''
  if (min && max) return `${formatVndCompact(min)} – ${formatVndCompact(max)}`
  if (min) return `≥ ${formatVndCompact(min)}`
  return `≤ ${formatVndCompact(max!)}`
}

/**
 * Format a VND amount compactly, e.g. 1_500_000 → "1.5tr"
 */
export function formatVndCompact(amount: number): string {
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000
    return `${m % 1 === 0 ? m : m.toFixed(1)}tr`
  }
  if (amount >= 1_000) {
    const k = amount / 1_000
    return `${k % 1 === 0 ? k : k.toFixed(0)}k`
  }
  return String(amount)
}
