export type ChatbotRole = 'user' | 'assistant'

export interface ChatbotMessage {
  id: string
  role: ChatbotRole
  content: string
  createdAt: string
  /** true khi tin nhắn này là thông báo lỗi do client sinh ra (không gửi lại cho server). */
  isError?: boolean
}

/** Dữ liệu gửi lên API chatbot. Sửa `toRequestBody` trong chatbot.service.ts nếu BE của bạn khác. */
export interface ChatbotRequest {
  /** undefined ở tin đầu tiên; BE trả về để dùng cho các tin sau */
  conversationId?: string
  message: string
  /** Vài tin gần nhất để BE giữ ngữ cảnh (tuỳ BE có dùng hay không) */
  history?: Pick<ChatbotMessage, 'role' | 'content'>[]
}

export interface ChatbotResponse {
  conversationId: string
  reply: string
}
