import type { RegisterOptions } from 'react-hook-form'

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** SĐT Việt Nam: 03/05/07/08/09 + 8 số, hoặc +84 */
export const VN_PHONE_RE = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/

export const rules = {
  required: (label: string): RegisterOptions['required'] => `${label} là bắt buộc`,
  email: {
    required: 'Email là bắt buộc',
    pattern: { value: EMAIL_RE, message: 'Email không hợp lệ' },
  },
  password: {
    required: 'Mật khẩu là bắt buộc',
    minLength: { value: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
  },
  phone: {
    required: 'Số điện thoại là bắt buộc',
    pattern: { value: VN_PHONE_RE, message: 'Số điện thoại Việt Nam không hợp lệ' },
  },
}
