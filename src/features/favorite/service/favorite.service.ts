import { http } from '@/config/axiosClient'
import { env } from '@/config/env'
import type { TutorResponse } from '@/features/tutor/types/tutor.types'
import { favorites, tutors } from '@/mocks/db'
import { delay, requireUser } from '@/mocks/session'

const USE_MOCK = env.useMock

export const favoriteService = {
  async getFavorites(): Promise<TutorResponse[]> {
    if (USE_MOCK) {
      await delay(250)
      const me = requireUser()
      const ids = favorites[me.id] ?? []
      return tutors.filter((t) => ids.includes(t.id) && t.profileStatus === 'APPROVED').map((t) => ({ ...t, contact: undefined }))
    }
    return http.get<TutorResponse[]>('/v1/favorites') // TODO: nối API
  },

  /** Trả về trạng thái sau khi bật/tắt. */
  async toggleFavorite(tutorId: string): Promise<{ favorited: boolean }> {
    if (USE_MOCK) {
      await delay(150)
      const me = requireUser()
      const list = favorites[me.id] ?? []
      const has = list.includes(tutorId)
      favorites[me.id] = has ? list.filter((x) => x !== tutorId) : [...list, tutorId]
      return { favorited: !has }
    }
    return http.post<{ favorited: boolean }>(`/v1/favorites/${tutorId}`) // TODO: nối API
  },
}
