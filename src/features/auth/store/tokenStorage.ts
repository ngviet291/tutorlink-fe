import type { AuthUser } from '@/features/user/types/user.types'

const ACCESS = 'tl_access_token'
const REFRESH = 'tl_refresh_token'
const USER = 'tl_user'

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* bỏ qua: private mode */
  }
}

function safeRemove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    /* bỏ qua */
  }
}

export const tokenStorage = {
  getAccessToken: (): string | null => safeGet(ACCESS),
  getRefreshToken: (): string | null => safeGet(REFRESH),
  setTokens(access: string, refresh: string): void {
    safeSet(ACCESS, access)
    safeSet(REFRESH, refresh)
  },
  getUser(): AuthUser | null {
    const raw = safeGet(USER)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthUser
    } catch {
      return null
    }
  },
  setUser(user: AuthUser): void {
    safeSet(USER, JSON.stringify(user))
  },
  clear(): void {
    safeRemove(ACCESS)
    safeRemove(REFRESH)
    safeRemove(USER)
  },
}
