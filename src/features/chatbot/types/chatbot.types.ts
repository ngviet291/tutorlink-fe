export type ChatbotRole = "user" | "assistant";

/** Khớp PostSummaryResponse của BE. */
export interface ChatbotPost {
  id: string;
  title: string;
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
  isError?: boolean;
  posts?: ChatbotPost[];
}

export interface ChatbotConversation {
  id: string;
  title: string;
  lastMessageAt: string;
}

export interface ChatbotRequest {
  conversationId?: string;
  message: string;
  location?: { ward?: string; province?: string };
}

export interface ChatbotResponse {
  conversationId?: string;
  reply: string;
  intent?: string;
  posts: ChatbotPost[];
}
