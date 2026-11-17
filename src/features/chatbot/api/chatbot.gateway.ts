import type {
  ChatbotConversation,
  ChatbotMessage,
  ChatbotRequest,
  ChatbotResponse,
} from "../types/chatbot.types";

export interface ChatbotGateway {
  getConversations(): Promise<ChatbotConversation[]>;
  getMessages(conversationId: string): Promise<ChatbotMessage[]>;
  deleteConversation(conversationId: string): Promise<void>;
  sendMessage(req: ChatbotRequest): Promise<ChatbotResponse>;
}
