import type { BudgetUnit } from "@/shared/types/common.types";

export type ChatRole = "USER" | "ASSISTANT";
export type ChatIntent = "CHAT" | "SEARCH_POSTS" | "ASK_CLARIFICATION";

export interface UserLocation { ward?: string; province?: string }

export interface ChatMessageRequest {
  conversationId?: string;
  message: string;                 // 1..1000 ký tự
  location?: UserLocation;
}

export interface PostSummaryResponse {
  id: string; title: string; subjectName: string; location?: string;
  minBudget?: number; maxBudget?: number; budgetUnit?: BudgetUnit;
  authorName: string; authorAvatarUrl?: string;
}

export interface ChatResponse {
  conversationId?: string;      
  intent: ChatIntent;
  message: string;                
  posts: PostSummaryResponse[];
}

export interface ChatMessageResponse {
  id: string; role: ChatRole; content: string; createdAt: string;
  posts: PostSummaryResponse[];
}

export interface ConversationResponse { id: string; title: string; lastMessageAt: string }