import { http } from '@/config/axiosClient'
import { env } from '@/config/env'
import { ApiError } from '@/shared/types/api.types'
import type { AuthUser, ChangePasswordPayload, UpdateProfilePayload } from '../types/user.types'
import { DEMO_PASSWORD, contacts, passwords } from '@/mocks/db'
import { delay, requireUser } from '@/mocks/session'

const USE_MOCK = env.useMock

export const userService = {
  async getMe(): Promise<AuthUser> {
    if (USE_MOCK) {
      await delay(200)
      return { ...requireUser() }
    }
    return http.get<AuthUser>('/v1/users/me')
  },

  async updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
    if (USE_MOCK) {
      await delay()
      const me = requireUser()
      me.fullName = payload.fullName
      me.phone = payload.phone
      me.address = { city: payload.city, district: payload.district }
      const c = contacts[me.id]
      if (c) c.phone = payload.phone
      return { ...me }
    }
    return http.put<AuthUser>('/v1/users/me', payload) // TODO: nối API
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    if (USE_MOCK) {
      await delay()
      const me = requireUser()
      if (payload.currentPassword !== (passwords[me.id] ?? DEMO_PASSWORD)) {
        throw new ApiError('Mật khẩu hiện tại không đúng.', 'WRONG_PASSWORD', 400)
      }
      passwords[me.id] = payload.newPassword
      return
    }
    await http.put<void>('/v1/users/me/password', payload) // TODO: nối API
  },
}
