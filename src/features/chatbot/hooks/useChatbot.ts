import { useCallback, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { ApiError } from "@/config/http/apiError";
import { chatbotService } from "@/config/di/container";
import type {
  ChatbotConversation,
  ChatbotMessage,
  ChatbotPost,
} from "../types/chatbot.types";
import { useTranslation } from "react-i18next";

const AI_QUOTA_MESSAGE =
  "Xin lỗi bạn, trợ lý TutorLink hiện đã đạt giới hạn sử dụng nên chưa thể tiếp tục hỗ trợ. Bạn vui lòng quay lại sau nhé! Cảm ơn bạn đã thông cảm.";
const UNEXPECTED_ERROR_MESSAGE = "An unexpected error occurred";
const AI_TEMPORARY_MESSAGE =
  "Trợ lý TutorLink hiện chưa thể phản hồi. Bạn vui lòng thử lại sau nhé!";
const NETWORK_MESSAGE =
  "Không thể kết nối với trợ lý TutorLink. Vui lòng kiểm tra kết nối và thử lại.";

function classifyChatbotError(error: unknown): {
  message: string;
  canRetry: boolean;
} {
  const status =
    error instanceof ApiError
      ? error.status
      : axios.isAxiosError(error)
        ? error.response?.status
        : undefined;

  if (status === 429) {
    return { message: AI_QUOTA_MESSAGE, canRetry: false };
  }

  const isUnexpectedChatbotError =
    (error instanceof ApiError &&
      status === 500 &&
      (error.rawMessage ?? error.message) === UNEXPECTED_ERROR_MESSAGE) ||
    (axios.isAxiosError(error) &&
      status === 500 &&
      error.response?.data?.message === UNEXPECTED_ERROR_MESSAGE);

  if (isUnexpectedChatbotError) {
    return { message: AI_QUOTA_MESSAGE, canRetry: false };
  }

  if (status === 502 || status === 503 || status === 504) {
    return { message: AI_TEMPORARY_MESSAGE, canRetry: true };
  }

  if (axios.isAxiosError(error) && !error.response) {
    return { message: NETWORK_MESSAGE, canRetry: true };
  }

  return { message: AI_TEMPORARY_MESSAGE, canRetry: false };
}

const makeMsg = (
  role: ChatbotMessage["role"],
  content: string,
  isError = false,
  posts?: ChatbotPost[],
  retryText?: string,
): ChatbotMessage => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  role,
  content,
  createdAt: new Date().toISOString(),
  isError,
  posts,
  retryText,
});

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

export function useChatbot() {
  const { t } = useTranslation();
  const greeting = t("chatbot.greeting");
  const userId = useSelector(
    (s: { auth: { user: { id: string } | null } }) => s.auth.user?.id,
  );
  const key = userId ? storageKey(userId) : undefined;

  const [messages, setMessages] = useState<ChatbotMessage[]>(() => [
    makeMsg("assistant", greeting),
  ]);
  const [conversations, setConversations] = useState<ChatbotConversation[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const conversationId = useRef<string | undefined>(undefined);

  useEffect(() => {
    conversationId.current = undefined;
    setMessages([makeMsg("assistant", greeting)]);
    setConversations([]);
    setHistoryError(null);

    const saved = key ? readSaved(key) : undefined;
    if (!key || !saved) return;

    let cancelled = false;
    chatbotService
      .getMessages(saved)
      .then((history) => {
        if (cancelled) return;
        conversationId.current = saved;
        setMessages([makeMsg("assistant", greeting), ...history]);
      })
      .catch(() => writeSaved(key, null));

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
    onError: (err, text) => {
      const failure = classifyChatbotError(err);
      setMessages((prev) => [
        ...prev,
        makeMsg(
          "assistant",
          failure.message,
          true,
          undefined,
          failure.canRetry ? text : undefined,
        ),
      ]);
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const id = conversationId.current;
      if (id) await chatbotService.deleteConversation(id);
    },
    onSuccess: () => {
      const deletedId = conversationId.current;
      conversationId.current = undefined;
      if (key) writeSaved(key, null);
      if (deletedId) {
        setConversations((prev) =>
          prev.filter((item) => item.id !== deletedId),
        );
      }
      setMessages([makeMsg("assistant", greeting)]);
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

  const retry = useCallback(
    (messageId: string) => {
      if (sendMutation.isPending) return;

      const failedMessage = messages.find(
        (message) => message.id === messageId,
      );
      if (!failedMessage?.retryText) return;

      setMessages((prev) => prev.filter((message) => message.id !== messageId));
      sendMutation.mutate(failedMessage.retryText);
    },
    [messages, sendMutation],
  );

  const refreshConversations = useCallback(async () => {
    if (!userId) {
      setConversations([]);
      return;
    }
    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const result = await chatbotService.getConversations();
      setConversations(result);
    } catch (error) {
      setHistoryError(classifyChatbotError(error).message);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [userId]);

  const loadConversation = useCallback(
    async (id: string) => {
      if (sendMutation.isPending || !userId) return false;
      setIsLoadingHistory(true);
      setHistoryError(null);
      try {
        const history = await chatbotService.getMessages(id);
        conversationId.current = id;
        if (key) writeSaved(key, id);
        setMessages([makeMsg("assistant", greeting), ...history]);
        return true;
      } catch (error) {
        setHistoryError(classifyChatbotError(error).message);
        return false;
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [key, sendMutation.isPending, userId],
  );
  const newConversation = useCallback(() => {
    if (sendMutation.isPending) return;
    conversationId.current = undefined;
    if (key) writeSaved(key, null);
    setMessages([makeMsg("assistant", greeting)]);
  }, [key, sendMutation.isPending]);

  return {
    messages,
    send,
    retry,
    clear: clearMutation.mutateAsync,
    isSending: sendMutation.isPending,
    isClearing: clearMutation.isPending,
    conversations,
    refreshConversations,
    loadConversation,
    newConversation,
    isLoadingHistory,
    historyError,
    canViewHistory: Boolean(userId),
  };
}
