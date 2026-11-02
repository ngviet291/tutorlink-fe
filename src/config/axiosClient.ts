import axios from 'axios'
import { env } from './env'
import { tokenStorage } from '@/features/auth/store/tokenStorage'

export const axiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
})

// Attach access token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 → clear tokens (refresh logic can be added here)
axiosInstance.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      tokenStorage.clearTokens()
    }
    return Promise.reject(err)
  },
)

// Typed helper so services don't need to destructure .data
export const http = {
  get: <T>(url: string, params?: object): Promise<T> =>
    axiosInstance.get(url, { params }) as unknown as Promise<T>,

  post: <T>(url: string, data?: unknown): Promise<T> =>
    axiosInstance.post(url, data) as unknown as Promise<T>,

  put: <T>(url: string, data?: unknown): Promise<T> =>
    axiosInstance.put(url, data) as unknown as Promise<T>,

  patch: <T>(url: string, data?: unknown): Promise<T> =>
    axiosInstance.patch(url, data) as unknown as Promise<T>,

  delete: <T>(url: string): Promise<T> =>
    axiosInstance.delete(url) as unknown as Promise<T>,
}
