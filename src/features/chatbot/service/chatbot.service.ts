import type { ChatbotGateway } from "../api/chatbot.gateway";
import type {
  ChatbotConversation,
  ChatbotMessage,
  ChatbotRequest,
  ChatbotResponse,
} from "../types/chatbot.types";

export class ChatbotService {
  private readonly gateway: ChatbotGateway;

  constructor(gateway: ChatbotGateway) {
    this.gateway = gateway;
  }

  getConversations(): Promise<ChatbotConversation[]> {
    return this.gateway.getConversations();
  }

  getMessages(conversationId: string): Promise<ChatbotMessage[]> {
    return this.gateway.getMessages(conversationId);
  }

  deleteConversation(conversationId: string): Promise<void> {
    return this.gateway.deleteConversation(conversationId);
  }

  sendMessage(req: ChatbotRequest): Promise<ChatbotResponse> {
    return this.gateway.sendMessage(req);
  }
}
