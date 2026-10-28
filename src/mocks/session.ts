import { tokenStorage } from '@/features/auth/store/tokenStorage'
import { ApiError } from '@/shared/types/api.types'
import { ERROR_MESSAGES } from '@/constants/errorMessage'
import { users } from './db'

export const delay = (ms = 350): Promise<void> => new Promise((r) => setTimeout(r, ms))

export function mockAccessToken(userId: string): string {
  return `mock-access-${userId}`
}
export function mockRefreshToken(userId: string): string {
  return `mock-refresh-${userId}`
}

export function currentUserId(): string | null {
  const t = tokenStorage.getAccessToken()
  return t?.startsWith('mock-access-') ? t.slice('mock-access-'.length) : null
}

export function requireUser() {
  const id = currentUserId()
  const user = users.find((u) => u.id === id)
  if (!user) throw new ApiError(ERROR_MESSAGES.UNAUTHORIZED, 'UNAUTHORIZED', 401)
  return user
}

/** Bật bằng cách chạy localStorage.setItem('tl_mock_ai_fail','1') để thử trạng thái fallback. */
export function aiShouldFail(): boolean {
  try {
    return localStorage.getItem('tl_mock_ai_fail') === '1'
  } catch {
    return false
  }
}

export function paginate<T>(items: T[], page = 1, pageSize = 9) {
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), page, pageSize, totalItems, totalPages }
}
