import type { AuthUser } from '@/features/user/types/user.types'
import type { Address } from '@/shared/types/common.types'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
  phone: string
  gender?: string
  dateOfBirth?: string
  address?: Address
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  newPassword: string
  confirmPassword: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser
}
