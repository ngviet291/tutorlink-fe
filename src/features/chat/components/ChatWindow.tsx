import { useEffect, useMemo } from "react";
import { ErrorState } from "@/shared/components/ui/EmptyState";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/useAppStore";
import {
  useChannelMessages,
  useMarkRead,
  useSendMessage,
} from "../hooks/useChat";
import { setActiveChannel } from "../store/chatUiSlice";
import type { ChatThread } from "../types/chat.types";
import { ChatHeader } from "./ChatHeader";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";

export function ChatWindow({ channel }: { channel: ChatThread }) {
  const { channelId, partner } = channel;
  const dispatch = useAppDispatch();
  const myId = useAppSelector((s) => s.auth.user?.id);
  const messagesQuery = useChannelMessages(channelId);
  const { send, resend } = useSendMessage(channelId, partner.id);
  const { mutate: markRead } = useMarkRead();

  // Mở kênh: đánh dấu kênh đang mở (để event mới không tính chưa đọc) và báo đã đọc
  useEffect(() => {
    dispatch(setActiveChannel(channelId));
    markRead(channelId);
    return () => {
      dispatch(setActiveChannel(null));
    };
  }, [channelId, dispatch, markRead]);

  // BE trả mới → cũ; hiển thị cũ → mới
  const messages = useMemo(
    () =>
      [
        ...(messagesQuery.data?.pages.flatMap((p) => p.messages) ?? []),
      ].reverse(),
    [messagesQuery.data],
  );

  return (
    <section className="flex h-[70vh] min-h-96 flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      <ChatHeader partner={partner} />
      {messagesQuery.isLoading ? (
        <Skeleton className="m-4 h-full" />
      ) : messagesQuery.isError ? (
        <ErrorState
          message="Không tải được tin nhắn."
          onRetry={() => void messagesQuery.refetch()}
        />
      ) : (
        <MessageList
          messages={messages}
          myId={myId}
          hasMore={Boolean(messagesQuery.hasNextPage)}
          isLoadingMore={messagesQuery.isFetchingNextPage}
          onLoadMore={() => void messagesQuery.fetchNextPage()}
          onResend={resend}
        />
      )}
      <MessageComposer channelId={channelId} onSend={send} />
    </section>
  );
}
