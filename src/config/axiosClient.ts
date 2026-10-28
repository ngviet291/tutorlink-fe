import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { env } from './env'
import { tokenStorage } from '@/features/auth/store/tokenStorage'
import { store } from '@/app/store'
import { clearAuth } from '@/features/auth/store/authSlice'
import { ApiError, type ApiErrorBody, type ApiResponse } from '@/shared/types/api.types'
import { ERROR_MESSAGES } from '@/constants/errorMessage'

export const axiosClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

let isRefreshing = false
let waiters: { resolve: (token: string) => void; reject: (e: unknown) => void }[] = []

function flushWaiters(error: unknown, token?: string): void {
  waiters.forEach((w) => (token ? w.resolve(token) : w.reject(error)))
  waiters = []
}

function forceLogout(): void {
  store.dispatch(clearAuth())
  if (window.location.pathname !== '/login') window.location.assign('/login')
}

/** Gọi bằng axios thường (không qua interceptor) để tránh vòng lặp. */
async function requestNewToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) throw new Error('NO_REFRESH_TOKEN')
  const res = await axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
    `${env.apiBaseUrl}/v1/auth/refresh-token`,
    { refreshToken },
  )
  const { accessToken, refreshToken: newRefresh } = res.data.data
  tokenStorage.setTokens(accessToken, newRefresh)
  return accessToken
}

axiosClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

axiosClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status

    if (status === 401 && original && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true

      if (isRefreshing) {
        // Xếp hàng chờ token mới rồi gửi lại
        return new Promise((resolve, reject) => {
          waiters.push({
            resolve: (token) => {
              original.headers.set('Authorization', `Bearer ${token}`)
              resolve(axiosClient(original))
            },
            reject,
          })
        })
      }

      isRefreshing = true
      try {
        const token = await requestNewToken()
        flushWaiters(null, token)
        original.headers.set('Authorization', `Bearer ${token}`)
        return axiosClient(original)
      } catch (refreshError) {
        flushWaiters(refreshError)
        forceLogout()
        return Promise.reject(new ApiError(ERROR_MESSAGES.UNAUTHORIZED, 'UNAUTHORIZED', 401))
      } finally {
        isRefreshing = false
      }
    }

    const message = error.response?.data?.message ?? (error.response ? ERROR_MESSAGES.UNKNOWN : ERROR_MESSAGES.NETWORK)
    return Promise.reject(new ApiError(message, error.response?.data?.code, status))
  },
)

/** Helper: bóc `data` từ ApiResponse<T>. */
export const http = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await axiosClient.get<ApiResponse<T>>(url, config)
    return res.data.data
  },
  async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await axiosClient.post<ApiResponse<T>>(url, body, config)
    return res.data.data
  },
  async put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const res = await axiosClient.put<ApiResponse<T>>(url, body, config)
    return res.data.data
  },
  async delete<T = void>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const res = await axiosClient.delete<ApiResponse<T>>(url, config)
    return res.data.data
  },
}
