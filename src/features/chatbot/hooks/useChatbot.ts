import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { getErrorMessage } from "@/shared/utils/errors";
import { chatbotService } from "../service/chatbot.service";
import type { ChatbotMessage, ChatbotPost } from "../types/chatbot.types";

const GREETING = "Xin chào! Mình là trợ lý TutorLink. Bạn cần hỗ trợ gì?";

const makeMsg = (
  role: ChatbotMessage["role"],
  content: string,
  isError = false,
  posts?: ChatbotPost[],
): ChatbotMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  role,
  content,
  createdAt: new Date().toISOString(),
  isError,
  posts,
});

// Id cuộc trò chuyện nhớ theo từng user để reload không mất và không lẫn giữa các tài khoản.
const storageKey = (userId: string) => `chatbot_conversation_${userId}`;

const readSaved = (key: string): string | undefined => {
  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
};
const writeSaved = (key: string, value: string | null) => {
  try {
    value ? localStorage.setItem(key, value) : localStorage.removeItem(key);
  } catch {
    /* bỏ qua */
  }
};

/**
 * State + gọi API cho chatbot.
 * Thành viên: nhớ conversationId và tải lại lịch sử (kèm bài đăng gợi ý) sau khi reload / đăng nhập lại.
 * Guest: BE không lưu nên chỉ nằm trong bộ nhớ.
 */
export function useChatbot() {
  const userId = useSelector(
    (s: { auth: { user: { id: string } | null } }) => s.auth.user?.id,
  );
  const key = userId ? storageKey(userId) : undefined;

  const [messages, setMessages] = useState<ChatbotMessage[]>(() => [
    makeMsg("assistant", GREETING),
  ]);
  const conversationId = useRef<string | undefined>(undefined);

  // Đổi tài khoản / đăng xuất thì làm mới; có conversation đã lưu thì tải lại lịch sử.
  useEffect(() => {
    conversationId.current = undefined;
    setMessages([makeMsg("assistant", GREETING)]);

    const saved = key ? readSaved(key) : undefined;
    if (!key || !saved) return;

    let cancelled = false;
    chatbotService
      .getMessages(saved)
      .then((history) => {
        if (cancelled) return;
        conversationId.current = saved;
        setMessages([makeMsg("assistant", GREETING), ...history]);
      })
      .catch(() => writeSaved(key, null)); // hội thoại đã bị xoá hoặc không còn quyền truy cập
    return () => {
      cancelled = true;
    };
  }, [key]);

  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      chatbotService.sendMessage({
        conversationId: conversationId.current,
        message: text,
      }),
    onSuccess: (res) => {
      if (res.conversationId) {
        conversationId.current = res.conversationId;
        if (key) writeSaved(key, res.conversationId);
      }
      setMessages((prev) => [
        ...prev,
        makeMsg("assistant", res.reply, false, res.posts),
      ]);
    },
    onError: (err) => {
      setMessages((prev) => [
        ...prev,
        makeMsg("assistant", getErrorMessage(err), true),
      ]);
    },
  });

  // Xóa cuộc trò chuyện: thành viên → xóa trên server rồi mới làm sạch local; guest → chỉ có local.
  const clearMutation = useMutation({
    mutationFn: async () => {
      const id = conversationId.current;
      if (id) await chatbotService.deleteConversation(id);
    },
    onSuccess: () => {
      conversationId.current = undefined;
      if (key) writeSaved(key, null);
      setMessages([makeMsg("assistant", GREETING)]);
    },
  });

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || sendMutation.isPending) return;
      setMessages((prev) => [...prev, makeMsg("user", text)]);
      sendMutation.mutate(text);
    },
    [sendMutation],
  );

  return {
    messages,
    send,
    /** Xóa cuộc trò chuyện hiện tại. Reject nếu server lỗi để UI báo lại. */
    clear: clearMutation.mutateAsync,
    isSending: sendMutation.isPending,
    isClearing: clearMutation.isPending,
  };
}
