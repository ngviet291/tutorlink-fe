// Environment configuration
// - VITE_USE_MOCK=true  → dùng mock data (không cần backend)
// - VITE_USE_MOCK=false → gọi API thật tại VITE_API_BASE_URL
// - Không đặt           → mock khi chạy `npm run dev`, API thật khi build production
const flag = import.meta.env.VITE_USE_MOCK as string | undefined

export const env = {
  useMock: flag !== undefined ? flag === 'true' : import.meta.env.DEV,
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080',
  /** Chatbot: để trống → dùng mock trả lời tự động. */
  chatbotApiUrl: (import.meta.env.VITE_CHATBOT_API_URL as string | undefined) ?? '',
  chatbotApiKey: (import.meta.env.VITE_CHATBOT_API_KEY as string | undefined) ?? '',
}
