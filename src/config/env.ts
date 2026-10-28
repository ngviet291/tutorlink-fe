export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080',
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
} as const
