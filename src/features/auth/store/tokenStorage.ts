const ACCESS_KEY = 'tl_access'
const REFRESH_KEY = 'tl_refresh'

export const tokenStorage = {
  getAccessToken(): string | null {
    try { return localStorage.getItem(ACCESS_KEY) } catch { return null }
  },
  getRefreshToken(): string | null {
    try { return localStorage.getItem(REFRESH_KEY) } catch { return null }
  },
  setTokens(access: string, refresh: string): void {
    try {
      localStorage.setItem(ACCESS_KEY, access)
      localStorage.setItem(REFRESH_KEY, refresh)
    } catch { /* ignore */ }
  },
  clearTokens(): void {
    try {
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
    } catch { /* ignore */ }
  },
}
