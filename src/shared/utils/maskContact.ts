export const LOCKED_PHONE = '09xx xxx xxx'
export const LOCKED_EMAIL = '••••••@••••.com'
export const CONTACT_LOCK_NOTE =
  'Thông tin liên hệ sẽ mở sau khi thanh toán phí nhận lớp'

/** Luôn trả về dạng đã che; chỉ dùng khi chưa mở khóa. */
export function maskPhone(): string {
  return LOCKED_PHONE
}

export function maskEmail(): string {
  return LOCKED_EMAIL
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`
  }
  return phone
}
