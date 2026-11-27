import { useChannels } from "./useChat";

export function useChatUnreadTotal(): number {
  const { data } = useChannels();
  return (data ?? []).reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
}
