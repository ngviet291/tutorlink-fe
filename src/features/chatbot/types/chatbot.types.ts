export type ChatbotRole = "user" | "assistant";

/** Khớp PostSummaryResponse của BE. */
export interface ChatbotPost {
  id: string;
  title: string;
  type: string;
  subjectName: string;
  location?: string | null;
  minBudget?: number | null;
  maxBudget?: number | null;
  budgetUnit?: string | null;
  authorName: string;
  authorAvatarUrl?: string | null;
}

export interface ChatbotMessage {
  id: string;
  role: ChatbotRole;
  content: string;
  createdAt: string;
  /** true khi tin nhắn này là thông báo lỗi do client sinh ra. */
  isError?: boolean;
  /** Bài đăng gợi ý kèm theo câu trả lời của bot. */
  posts?: ChatbotPost[];
}

/** Khớp ChatMessageRequest của BE. */
export interface ChatbotRequest {
  /** undefined ở tin đầu tiên; guest thì BE luôn trả null */
  conversationId?: string;
  message: string;
  location?: { ward?: string; province?: string };
}

/** Khớp ChatResponse của BE (message → reply). */
export interface ChatbotResponse {
  conversationId?: string;
  reply: string;
  intent?: string;
  posts: ChatbotPost[];
}
