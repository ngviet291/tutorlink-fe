import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { chatService } from "@/config/di/container";
import type { RealtimeStatus } from "@/config/realtime/realtime.types";
import { queryKeys } from "@/constants/queryKeys";
import { useAppSelector } from "@/shared/hooks/useAppStore";
import { useRealtimeStatus } from "@/shared/realtime/useRealtimeStatus";
import {
  bumpThread,
  clearThreadUnread,
  mergeThreads,
  replaceTemp,
  setMessageStatus,
  upsertOptimistic,
  type MessagesCache,
} from "../realtime/chatCache";
import { previewOf } from "../mapper/chat.mapper";
import {
  detectMediaType,
  newTempId,
  type ChatMessage,
  type ChatThread,
  type MediaPayload,
  type MessagePage,
  type SendMessageInput,
} from "../types/chat.types";

export const POLL_INTERVAL_MS = 15_000;

/** Polling dự phòng: chỉ khi WebSocket không ở trạng thái connected. */
export function pollingInterval(status: RealtimeStatus): number | false {
  return status === "connected" ? false : POLL_INTERVAL_MS;
}

export function useChannels(enabled = true) {
  const qc = useQueryClient();
  const status = useRealtimeStatus();
  return useQuery({
    queryKey: queryKeys.chat.channels,
    queryFn: async () =>
      mergeThreads(
        qc.getQueryData<ChatThread[]>(queryKeys.chat.channels),
        await chatService.listChannels(),
      ),
    enabled,
    refetchInterval: pollingInterval(status),
  });
}

export function useChannel(channelId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.channel(channelId ?? ""),
    queryFn: () => chatService.getChannel(channelId ?? ""),
    enabled: Boolean(channelId),
    retry: false,
  });
}

/** Mở chat từ hồ sơ/đơn ứng tuyển: `data = null` nghĩa là chưa có channel (404). */
export function useChannelWithPartner(partnerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.withPartner(partnerId ?? ""),
    queryFn: () => chatService.findChannelWithPartner(partnerId ?? ""),
    enabled: Boolean(partnerId),
    retry: false,
  });
}

/** Phân trang theo cursor: BE trả mới → cũ, `fetchNextPage` tải các tin cũ hơn. */
export function useChannelMessages(channelId: string | undefined) {
  const status = useRealtimeStatus();
  return useInfiniteQuery<
    MessagePage,
    Error,
    InfiniteData<MessagePage, string | undefined>,
    readonly unknown[],
    string | undefined
  >({
    queryKey: queryKeys.chat.messages(channelId ?? ""),
    queryFn: ({ pageParam }) =>
      chatService.getMessages(channelId ?? "", pageParam),
    initialPageParam: undefined,
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor : undefined),
    enabled: Boolean(channelId),
    retry: false,
    refetchInterval: pollingInterval(status),
  });
}

export function useUnreadCount(enabled = true) {
  const status = useRealtimeStatus();
  return useQuery({
    queryKey: queryKeys.chat.unread,
    queryFn: () => chatService.getUnreadCount(),
    enabled,
    refetchInterval: pollingInterval(status),
  });
}

/** Upload file trước, BE trả { publicId, url, mediaType } rồi mới gửi tin nhắn. */
export function useUploadMedia(channelId: string) {
  return useMutation({
    mutationFn: (file: File) =>
      chatService.uploadMedia(channelId, detectMediaType(file), file),
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (channelId: string) => chatService.markRead(channelId),
    onMutate: (channelId) => {
      qc.setQueryData<ChatThread[]>(queryKeys.chat.channels, (old) =>
        clearThreadUnread(old, channelId),
      );
    },
    onSettled: () =>
      void qc.invalidateQueries({ queryKey: queryKeys.chat.unread }),
  });
}

interface SendVariables {
  tempId: string;
  content: string;
  media: MediaPayload[];
}

/**
 * Gửi tin kiểu optimistic: chèn tin tạm `sending` → thay bằng tin thật khi thành công → `failed` khi lỗi.
 * `resend` dùng lại đúng tin tạm đã lỗi (giữ cả content lẫn media).
 */
export function useSendMessage(channelId: string, receiverId: string) {
  const qc = useQueryClient();
  const myId = useAppSelector((s) => s.auth.user?.id);
  const messagesKey = queryKeys.chat.messages(channelId);

  const mutation = useMutation({
    mutationFn: ({ content, media }: SendVariables) =>
      chatService.sendMessage(receiverId, content, media),
    onMutate: async ({ tempId, content, media }) => {
      await qc.cancelQueries({ queryKey: messagesKey }); // refetch đang chạy sẽ ghi đè tin tạm
      const temp: ChatMessage = {
        id: tempId,
        channelId,
        senderId: myId ?? "",
        content,
        sentAt: new Date().toISOString(),
        media, // bubble hiện ảnh ngay khi đang gửi
        status: "sending",
      };
      qc.setQueryData<MessagesCache>(messagesKey, (old) =>
        upsertOptimistic(old, temp),
      );
    },
    onSuccess: (real, { tempId }) => {
      qc.setQueryData<MessagesCache>(messagesKey, (old) =>
        replaceTemp(old, tempId, real),
      );
      qc.setQueryData<ChatThread[]>(queryKeys.chat.channels, (old) =>
        old
          ? bumpThread(old, {
              channelId,
              preview: previewOf(real),
              sentAt: real.sentAt,
              countUnread: false,
            }).threads
          : old,
      );
    },
    onError: (_error, { tempId }) => {
      qc.setQueryData<MessagesCache>(messagesKey, (old) =>
        setMessageStatus(old, tempId, "failed"),
      );
    },
  });

  return {
    send: (input: SendMessageInput) =>
      mutation.mutate({
        tempId: newTempId(),
        content: input.content.trim(),
        media: input.media ? [input.media] : [],
      }),
    resend: (message: Pick<ChatMessage, "id" | "content" | "media">) =>
      mutation.mutate({
        tempId: message.id,
        content: message.content,
        media: message.media ?? [],
      }),
    isPending: mutation.isPending,
  };
}
