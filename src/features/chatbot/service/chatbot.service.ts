import axios from 'axios'
import { env } from '@/config/env'
import { http } from '@/config/axiosClient'
import { tokenStorage } from '@/features/auth/store/tokenStorage'
import type { ChatbotRequest, ChatbotResponse } from '../types/chatbot.types'

/* ──────────────────────────────────────────────────────────────────────────
 * CHATBOT API — NƠI ĐỂ GẮN API SAU NÀY
 *
 * Có 3 chế độ, chọn theo biến môi trường (xem src/config/env.ts):
 *   1. VITE_CHATBOT_API_URL có giá trị → gọi thẳng URL đó (dịch vụ chatbot riêng / LLM gateway).
 *   2. Không có URL + VITE_USE_MOCK=false → gọi backend chính: POST {VITE_API_BASE_URL}/v1/chatbot/messages
 *   3. Còn lại (mặc định khi `npm run dev`) → mock trả lời tự động, không cần backend.
 *
 * Khi đã có API thật, chỉ cần sửa 2 hàm bên dưới cho khớp hợp đồng của BE:
 *   - toRequestBody(): hình dạng body gửi đi
 *   - fromResponseBody(): lấy câu trả lời + conversationId từ response
 * ────────────────────────────────────────────────────────────────────────── */

const BACKEND_PATH = '/v1/chatbot/messages'
const REQUEST_TIMEOUT_MS = 30_000

/** ChatbotRequest → body JSON gửi lên API. */
function toRequestBody(req: ChatbotRequest): unknown {
  return {
    conversationId: req.conversationId,
    message: req.message,
    history: req.history,
  }
}

/** Response của API → ChatbotResponse. Chấp nhận vài dạng phổ biến để đỡ phải sửa. */
function fromResponseBody(data: unknown, fallbackConversationId?: string): ChatbotResponse {
  const d = (data ?? {}) as Record<string, unknown>
  const inner = (d.data ?? d) as Record<string, unknown> // bọc trong ApiResponse { data } hoặc không
  const reply = inner.reply ?? inner.answer ?? inner.message ?? inner.content ?? inner.text
  if (typeof reply !== 'string' || !reply) throw new Error('Chatbot không trả về nội dung.')
  const conversationId = String(inner.conversationId ?? inner.sessionId ?? fallbackConversationId ?? '')
  return { conversationId, reply }
}

/* ── Mock ─────────────────────────────────────────────────────────────── */

const MOCK_RULES: { test: RegExp; answer: string }[] = [
  { test: /phí|thanh toán|hoa hồng/i, answer: 'Gia sư trả phí nhận lớp (mặc định 20% học phí tháng đầu) sau khi được chọn. Thanh toán xong, thông tin liên hệ và kênh chat sẽ được mở.' },
  { test: /đăng bài|tạo bài|đăng tin/i, answer: 'Bạn vào mục "Bài đăng" → "Tạo bài đăng", điền môn học, ngân sách, hình thức học rồi bấm Đăng. Có thể lưu nháp trước.' },
  { test: /tìm gia sư|gia sư nào|tìm thầy|tìm cô/i, answer: 'Vào "Tìm Gia Sư" và lọc theo môn, khu vực, hình thức học, mức giá. Bạn cũng có thể đăng bài để gia sư chủ động đăng ký.' },
  { test: /tìm lớp|nhận lớp|dạy thêm/i, answer: 'Gia sư vào "Tìm Lớp" để xem các bài đăng đang mở và bấm Đăng ký. Hồ sơ cần được Admin duyệt trước.' },
  { test: /xin chào|chào|hello|hi\b/i, answer: 'Xin chào! Mình là trợ lý TutorLink. Bạn cần hỏi về đăng bài, tìm gia sư hay phí nhận lớp?' },
]

async function mockReply(req: ChatbotRequest): Promise<ChatbotResponse> {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 500))
  const hit = MOCK_RULES.find((r) => r.test.test(req.message))
  return {
    conversationId: req.conversationId ?? `mock-conv-${Date.now()}`,
    reply: hit?.answer ?? 'Mình chưa có câu trả lời cho câu này (đang chạy chế độ mock). Khi nối API chatbot, câu trả lời thật sẽ hiện ở đây.',
  }
}

/* ── Public API ───────────────────────────────────────────────────────── */

export const chatbotService = {
  async sendMessage(req: ChatbotRequest): Promise<ChatbotResponse> {
    // 1) Dịch vụ chatbot riêng
    if (env.chatbotApiUrl) {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (env.chatbotApiKey) headers.Authorization = `Bearer ${env.chatbotApiKey}`
      const res = await axios.post(env.chatbotApiUrl, toRequestBody(req), { headers, timeout: REQUEST_TIMEOUT_MS })
      return fromResponseBody(res.data, req.conversationId)
    }
    // 2) Backend chính (đã đăng nhập → axiosInstance tự gắn access token)
    if (!env.useMock) {
      if (!tokenStorage.getAccessToken()) throw new Error('Vui lòng đăng nhập để dùng chatbot.')
      const data = await http.post<unknown>(BACKEND_PATH, toRequestBody(req))
      return fromResponseBody(data, req.conversationId)
    }
    // 3) Mock
    return mockReply(req)
  },
}
