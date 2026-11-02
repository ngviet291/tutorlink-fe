import { http } from '@/config/axiosClient'
import { env } from '@/config/env'
import { tokenStorage } from '../store/tokenStorage'
import type { AuthResponse, AuthTokens, ForgotPasswordPayload, LoginPayload, RegisterPayload } from '../types/auth.types'
import { ApiError } from '@/shared/types/api.types'
import { ERROR_MESSAGES } from '@/constants/errorMessage'
import { DEMO_PASSWORD, notifications, nextId, tutors, users, wallets, passwords } from '@/mocks/db'
import { delay, mockAccessToken, mockRefreshToken } from '@/mocks/session'

const USE_MOCK = env.useMock

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    if (USE_MOCK) {
      await delay()
      const user = users.find((u) => u.email.toLowerCase() === payload.email.trim().toLowerCase())
      if (!user || payload.password !== (passwords[user.id] ?? DEMO_PASSWORD)) {
        throw new ApiError(ERROR_MESSAGES.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS', 401)
      }
      if (user.userStatus !== 'ACTIVE') {
        throw new ApiError(ERROR_MESSAGES.ACCOUNT_LOCKED, 'ACCOUNT_LOCKED', 403)
      }
      return { user: { ...user }, accessToken: mockAccessToken(user.id), refreshToken: mockRefreshToken(user.id) }
    }
    return http.post<AuthResponse>('/v1/auth/login', payload)
  },

  registerStudent(payload: RegisterPayload): Promise<AuthResponse> {
    return registerMock('STUDENT', payload, () => http.post<AuthResponse>('/v1/auth/register/student', payload))
  },

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

  async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    if (USE_MOCK) {
      await delay()
      const user = users.find((u) => u.email.toLowerCase() === payload.email.trim().toLowerCase())
      if (!user) return // Không báo lỗi để tránh lộ email
      const newPass = Math.random().toString(36).slice(2, 10)
      passwords[user.id] = newPass
      return
    }
    await http.post<void>('/v1/auth/forgot-password', payload)
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
    userStatus: 'ACTIVE' as const,
    gender: (payload.gender ?? 'OTHER') as 'MALE' | 'FEMALE' | 'OTHER',
    dateOfBirth: payload.dateOfBirth ?? '2000-01-01',
    address: payload.address ?? { province: '' },
    createdAt: new Date().toISOString(),
  }
  users.push(user)
  passwords[id] = payload.password
  if (role === 'TUTOR') {
    wallets[id] = 0
    tutors.push({
      id,
      fullName: user.fullName,
      experienceYears: 0,
      hourlyRate: 0,
      averageRating: 0,
      verificationStatus: 'PENDING',
    })
  }
  notifications[id] = [
    {
      id: nextId('n'),
      notificationType: 'SYSTEM',
      title: 'Chào mừng đến với TutorLink',
      content: role === 'TUTOR' ? 'Hồ sơ gia sư đang chờ Admin duyệt.' : 'Bạn có thể đăng bài tìm gia sư ngay.',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  ]
  return { user: { ...user }, accessToken: mockAccessToken(id), refreshToken: mockRefreshToken(id) }
}
