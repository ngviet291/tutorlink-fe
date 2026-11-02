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
 * Format an ISO date string to a localized date string.
 * e.g. "2024-03-15T10:00:00Z" → "15/03/2024"
 */
export function formatDate(iso: string, locale = 'vi-VN'): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Format an ISO date string to a localized datetime string.
 */
export function formatDateTime(iso: string, locale = 'vi-VN'): string {
  return new Date(iso).toLocaleString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a number with thousand separators.
 * e.g. 1500000 → "1.500.000"
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('vi-VN').format(n)
}
