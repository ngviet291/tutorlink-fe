import axios from "axios";
import { env } from "@/config/env";
import { http } from "@/config/axiosClient";
import type {
  ChatbotMessage,
  ChatbotPost,
  ChatbotRequest,
  ChatbotResponse,
} from "../types/chatbot.types";

/* ──────────────────────────────────────────────────────────────────────────
 * CHATBOT API
 *
 *   - VITE_CHATBOT_API_URL có giá trị → gọi thẳng URL đó (dịch vụ chatbot riêng).
 *   - Ngược lại → backend chính: POST {VITE_API_BASE_URL}/v1/chatbot/messages
 *     (public: Guest + Student + Tutor; có token thì `http` tự gắn Bearer).
 * ────────────────────────────────────────────────────────────────────────── */

const BACKEND_PATH = "/v1/chatbot/messages";
const CONVERSATIONS_PATH = "/v1/chatbot/conversations";
const REQUEST_TIMEOUT_MS = 30_000;
const NOT_FOUND = 404;

/** ChatbotRequest → ChatMessageRequest của BE. */
function toRequestBody(req: ChatbotRequest): unknown {
  return {
    conversationId: req.conversationId,
    message: req.message,
    location: req.location,
  };
}

/** ChatResponse của BE → ChatbotResponse. (interceptor đã bóc envelope `data`) */
function fromResponseBody(
  data: unknown,
  fallbackConversationId?: string,
): ChatbotResponse {
  const d = (data ?? {}) as Record<string, unknown>;
  const inner = (d.data ?? d) as Record<string, unknown>;
  const reply = inner.message;
  if (typeof reply !== "string" || !reply)
    throw new Error("Chatbot không trả về nội dung.");
  return {
    conversationId: inner.conversationId
      ? String(inner.conversationId)
      : fallbackConversationId,
    reply,
    intent: typeof inner.intent === "string" ? inner.intent : undefined,
    posts: Array.isArray(inner.posts) ? (inner.posts as ChatbotPost[]) : [],
  };
}

/** Khớp ChatMessageResponse của BE. `posts` là các bài đăng bot đã gợi ý kèm tin nhắn đó. */
interface ChatMessageDto {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
  posts?: ChatbotPost[];
}

/** Lỗi đã bị interceptor đổi thành ApiError (có `status`) hoặc vẫn là AxiosError. */
function isNotFound(error: unknown): boolean {
  if (axios.isAxiosError(error)) return error.response?.status === NOT_FOUND;
  return (error as { status?: number } | null)?.status === NOT_FOUND;
}

export const chatbotService = {
  /** Lịch sử một cuộc trò chuyện của thành viên (cần đăng nhập). */
  async getMessages(conversationId: string): Promise<ChatbotMessage[]> {
    const res = await http.get<ChatMessageDto[] | { data: ChatMessageDto[] }>(
      `${CONVERSATIONS_PATH}/${conversationId}/messages`,
    );
    const list = Array.isArray(res.data) ? res.data : res.data.data;
    return list.map((m) => ({
      id: m.id,
      role: m.role === "USER" ? "user" : "assistant",
      content: m.content,
      createdAt: m.createdAt,
      posts: m.posts ?? [],
    }));
  },

  /** Xóa cuộc trò chuyện và toàn bộ tin nhắn của nó (cần đăng nhập). */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await http.delete(`${CONVERSATIONS_PATH}/${conversationId}`);
    } catch (error) {
      // 404: hội thoại đã bị xóa từ trước → mục tiêu đã đạt, coi như thành công
      if (isNotFound(error)) return;
      throw error;
    }
  },

  async sendMessage(req: ChatbotRequest): Promise<ChatbotResponse> {
    if (env.chatbotApiUrl) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (env.chatbotApiKey)
        headers.Authorization = `Bearer ${env.chatbotApiKey}`;
      const res = await axios.post(env.chatbotApiUrl, toRequestBody(req), {
        headers,
        timeout: REQUEST_TIMEOUT_MS,
      });
      return fromResponseBody(res.data, req.conversationId);
    }
    const data = await http.post<unknown>(BACKEND_PATH, toRequestBody(req), {
      timeout: REQUEST_TIMEOUT_MS,
    });
    return fromResponseBody(data, req.conversationId);
  },
};
