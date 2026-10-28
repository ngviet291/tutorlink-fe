import { http } from '@/config/axiosClient'
import { env } from '@/config/env'
import { tokenStorage } from '../store/tokenStorage'
import type { AuthResponse, AuthTokens, LoginPayload, RegisterPayload } from '../types/auth.types'
import { ApiError } from '@/shared/types/api.types'
import { ERROR_MESSAGES } from '@/constants/errorMessage'
import { DEMO_PASSWORD, contacts, passwords, notifications, nextId, tutors, users, wallets } from '@/mocks/db'
import { delay, mockAccessToken, mockRefreshToken } from '@/mocks/session'
import { LOCKED_PHONE } from '@/shared/utils/maskContact'

const USE_MOCK = env.useMock

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    if (USE_MOCK) {
      await delay()
      const user = users.find((u) => u.email.toLowerCase() === payload.email.trim().toLowerCase())
      if (!user || payload.password !== (passwords[user.id] ?? DEMO_PASSWORD)) {
        throw new ApiError(ERROR_MESSAGES.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS', 401)
      }
      if (user.status !== 'ACTIVE') {
        throw new ApiError('Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.', 'ACCOUNT_LOCKED', 403)
      }
      return { user, accessToken: mockAccessToken(user.id), refreshToken: mockRefreshToken(user.id) }
    }
    return http.post<AuthResponse>('/v1/auth/login', payload)
  },

  registerStudent(payload: RegisterPayload): Promise<AuthResponse> {
    return registerMock('STUDENT', payload, () => http.post<AuthResponse>('/v1/auth/register/student', payload))
  },

  /** Gia sư: hồ sơ ở trạng thái PENDING, ví số dư 0 được tạo sẵn. */
  registerTutor(payload: RegisterPayload): Promise<AuthResponse> {
    return registerMock('TUTOR', payload, () => http.post<AuthResponse>('/v1/auth/register/tutor', payload))
  },

  async refreshToken(): Promise<AuthTokens> {
    if (USE_MOCK) {
      const refresh = tokenStorage.getRefreshToken() ?? ''
      return { accessToken: refresh.replace('refresh', 'access'), refreshToken: refresh }
    }
    return http.post<AuthTokens>('/v1/auth/refresh-token', { refreshToken: tokenStorage.getRefreshToken() })
  },

  async logout(): Promise<void> {
    if (USE_MOCK) return
    await http.post<void>('/v1/auth/logout', { refreshToken: tokenStorage.getRefreshToken() })
  },
}

async function registerMock(
  role: 'STUDENT' | 'TUTOR',
  payload: RegisterPayload,
  real: () => Promise<AuthResponse>,
): Promise<AuthResponse> {
  if (!USE_MOCK) return real()
  await delay()
  if (users.some((u) => u.email.toLowerCase() === payload.email.trim().toLowerCase())) {
    throw new ApiError(ERROR_MESSAGES.EMAIL_EXISTS, 'EMAIL_EXISTS', 409)
  }
  const id = nextId(role === 'TUTOR' ? 't' : 's')
  const user = {
    id,
    fullName: payload.fullName.trim(),
    email: payload.email.trim(),
    phone: payload.phone,
    role,
    status: 'ACTIVE' as const,
    address: { city: payload.city, district: payload.district },
    profileStatus: role === 'TUTOR' ? ('PENDING' as const) : undefined,
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  contacts[id] = { phone: payload.phone, email: payload.email.trim() }
  passwords[id] = payload.password
  if (role === 'TUTOR') {
    wallets[id] = 0
    tutors.push({
      id, fullName: user.fullName, subjects: [], experienceYears: 0, hourlyRate: 0, averageRating: 0,
      profileStatus: 'PENDING', certificates: [], maskedPhone: LOCKED_PHONE, city: payload.city, district: payload.district,
      createdAt: user.createdAt,
    })
  }
  notifications[id] = [
    {
      id: nextId('n'), type: 'REGISTERED', title: 'Chào mừng đến với TutorLink',
      body: role === 'TUTOR' ? 'Hồ sơ gia sư đang chờ Admin duyệt.' : 'Bạn có thể đăng bài tìm gia sư ngay.',
      read: false, createdAt: new Date().toISOString(),
    },
  ]
  return { user, accessToken: mockAccessToken(id), refreshToken: mockRefreshToken(id) }
}
