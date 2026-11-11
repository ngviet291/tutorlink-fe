import type { InfiniteData } from "@tanstack/react-query";
import {
  isTempId,
  type ChatMessage,
  type ChatThread,
  type MediaPayload,
  type MessagePage,
  type MessageStatus,
} from "../types/chat.types";

/**
 * Hàm thuần cập nhật cache chat (không đụng QueryClient, không đổi dữ liệu đầu vào).
 * Cache tin nhắn là `InfiniteData<MessagePage>`: `pages[0]` là trang mới nhất, mỗi trang xếp mới → cũ.
 * Hàm nhận `undefined` (chưa tải) thì trả `undefined`: không tạo cache cho kênh chưa mở.
 */
export type MessagesCache = InfiniteData<MessagePage, string | undefined>;

const mapMessages = (
  data: MessagesCache,
  fn: (messages: ChatMessage[]) => ChatMessage[],
): MessagesCache => ({
  ...data,
  pages: data.pages.map((p) => ({ ...p, messages: fn(p.messages) })),
});

export function hasMessage(
  data: MessagesCache | undefined,
  id: string,
): boolean {
  return Boolean(data?.pages.some((p) => p.messages.some((m) => m.id === id)));
}

function prependMessage(
  data: MessagesCache,
  message: ChatMessage,
): MessagesCache {
  if (data.pages.length === 0) {
    return {
      ...data,
      pages: [{ messages: [message], hasNext: false }],
      pageParams: [undefined],
    };
  }
  const [first, ...rest] = data.pages;
  return {
    ...data,
    pages: [{ ...first!, messages: [message, ...first!.messages] }, ...rest],
  };
}

// /** Bỏ MỘT tin tạm đang gửi có cùng người gửi và nội dung (echo WS có thể đến trước phản hồi REST). */
// function dropMatchingPending(
//   data: MessagesCache,
//   message: ChatMessage,
// ): MessagesCache {
//   let dropped = false;
//   return mapMessages(data, (list) =>
//     list.filter((m) => {
//       if (dropped) return true;
//       const match =
//         isTempId(m.id) &&
//         m.status === "sending" &&
//         m.senderId === message.senderId &&
//         m.content === message.content;
//       if (match) dropped = true;
//       return !match;
//     }),
//   );
// }

/** Thêm tin thật nếu chưa có (chống trùng giữa REST và event). */
export function upsertMessage(
  data: MessagesCache | undefined,
  message: ChatMessage,
): MessagesCache | undefined {
  if (!data || hasMessage(data, message.id)) return data;
  return prependMessage(dropMatchingPending(data, message), message);
}

/** Tin tạm lúc bấm gửi. Nếu đã có (gửi lại) thì chỉ đặt lại `sending`. */
export function upsertOptimistic(
  data: MessagesCache | undefined,
  temp: ChatMessage,
): MessagesCache | undefined {
  if (!data) return data;
  if (hasMessage(data, temp.id))
    return setMessageStatus(data, temp.id, "sending");
  return prependMessage(data, temp);
}

/** Thay tin tạm bằng tin thật từ REST; nếu event đã thêm tin thật trước thì chỉ bỏ tin tạm. */
export function replaceTemp(
  data: MessagesCache | undefined,
  tempId: string,
  real: ChatMessage,
): MessagesCache | undefined {
  if (!data) return data;
  const without = mapMessages(data, (list) =>
    list.filter((m) => m.id !== tempId),
  );
  return hasMessage(without, real.id) ? without : prependMessage(without, real);
}

export function setMessageStatus(
  data: MessagesCache | undefined,
  id: string,
  status: MessageStatus,
): MessagesCache | undefined {
  if (!data) return data;
  return mapMessages(data, (list) =>
    list.map((m) => (m.id === id ? { ...m, status } : m)),
  );
}

/** Đối phương đã đọc tới `readAt`: các tin của tôi gửi trước thời điểm đó thành `read`. */
export function markMineRead(
  data: MessagesCache | undefined,
  myId: string,
  readAt: string,
): MessagesCache | undefined {
  if (!data) return data;
  const limit = Date.parse(readAt);
  if (Number.isNaN(limit)) return data;
  return mapMessages(data, (list) =>
    list.map((m) =>
      m.senderId === myId &&
      m.status === "sent" &&
      Date.parse(m.sentAt) <= limit
        ? { ...m, status: "read" }
        : m,
    ),
  );
}

const sameMedia = (a?: MediaPayload[], b?: MediaPayload[]): boolean => {
  const x = a ?? [];
  const y = b ?? [];
  return (
    x.length === y.length && x.every((m, i) => m.publicId === y[i]?.publicId)
  );
};
/** Bỏ MỘT tin tạm đang gửi có cùng người gửi, nội dung và media (echo WS có thể đến trước phản hồi REST). */
function dropMatchingPending(
  data: MessagesCache,
  message: ChatMessage,
): MessagesCache {
  let dropped = false;
  return mapMessages(data, (list) =>
    list.filter((m) => {
      if (dropped) return true;
      const match =
        isTempId(m.id) &&
        m.status === "sending" &&
        m.senderId === message.senderId &&
        m.content === message.content &&
        sameMedia(m.media, message.media);
      if (match) dropped = true;
      return !match;
    }),
  );
}
/* ---------------- Threads (danh sách channel) ---------------- */

export interface ThreadUpdate {
  channelId: string;
  preview: string;
  sentAt: string;
  /** true: tin của đối phương ở kênh không mở → +1 chưa đọc. */
  countUnread: boolean;
}

/** Cập nhật lastMessage, đưa lên đầu nếu tin mới hơn. `found=false` nếu channel chưa có trong cache. */
export function bumpThread(
  threads: ChatThread[],
  u: ThreadUpdate,
): { threads: ChatThread[]; found: boolean } {
  const index = threads.findIndex((t) => t.channelId === u.channelId);
  if (index === -1) return { threads, found: false };
  const current = threads[index]!;
  const isNewer =
    !current.lastMessageAt ||
    Date.parse(u.sentAt) >= Date.parse(current.lastMessageAt);
  const updated: ChatThread = {
    ...current,
    unreadCount: current.unreadCount + (u.countUnread ? 1 : 0),
    ...(isNewer ? { lastMessage: u.preview, lastMessageAt: u.sentAt } : {}),
  };
  if (!isNewer)
    return {
      threads: threads.map((t, i) => (i === index ? updated : t)),
      found: true,
    };
  return {
    threads: [updated, ...threads.slice(0, index), ...threads.slice(index + 1)],
    found: true,
  };
}

export function clearThreadUnread(
  threads: ChatThread[] | undefined,
  channelId: string,
): ChatThread[] | undefined {
  if (!threads) return threads;
  return threads.map((t) =>
    t.channelId === channelId && t.unreadCount > 0
      ? { ...t, unreadCount: 0 }
      : t,
  );
}

/** Gộp danh sách mới từ BE với cache: giữ phần FE tự theo dõi (unread, lastMessage) mà BE chưa trả. */
export function mergeThreads(
  prev: ChatThread[] | undefined,
  fresh: ChatThread[],
): ChatThread[] {
  if (!prev) return fresh;
  const byId = new Map(prev.map((t) => [t.channelId, t]));
  return fresh.map((t) => {
    const old = byId.get(t.channelId);
    if (!old) return t;
    const keepPreview =
      old.lastMessage !== undefined &&
      (!t.lastMessageAt ||
        (old.lastMessageAt !== undefined &&
          Date.parse(old.lastMessageAt) >= Date.parse(t.lastMessageAt)));
    return {
      ...t,
      unreadCount: old.unreadCount,
      ...(keepPreview
        ? { lastMessage: old.lastMessage, lastMessageAt: old.lastMessageAt }
        : {}),
    };
  });
}

export const incrementCount = (n: number | undefined): number | undefined =>
  n === undefined ? n : n + 1;
