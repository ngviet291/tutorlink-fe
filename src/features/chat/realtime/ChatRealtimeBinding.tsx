import { useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useStore } from 'react-redux'
import type { IRealtimeClient } from '@/config/realtime/IRealtimeClient'
import type { RealtimeEventRouter } from '@/config/realtime/RealtimeEventRouter'
import type { RootState } from '@/app/store'
import { useMarkRead } from '../hooks/useChat'
import { createKeyedDebounce } from './keyedDebounce'
import {
  registerChatRealtimeHandlers,
  syncChatAfterReconnect,
  type ChatRealtimeContext,
} from './chatRealtime.handlers'

const MARK_READ_DEBOUNCE_MS = 400

interface Props {
  client: IRealtimeClient
  router: RealtimeEventRouter
}

/** Nối feature chat vào hạ tầng realtime (đăng ký handler + đồng bộ sau reconnect). Không render gì. */
export function ChatRealtimeBinding({ client, router }: Props) {
  const queryClient = useQueryClient()
  const store = useStore<RootState>()
  const { mutate: markRead } = useMarkRead()

  const debounced = useMemo(() => createKeyedDebounce((id) => markRead(id), MARK_READ_DEBOUNCE_MS), [markRead])
  useEffect(() => () => debounced.cancel(), [debounced])

  const ctx = useMemo<ChatRealtimeContext>(
    () => ({
      queryClient,
      // Đọc từ store tại thời điểm xử lý để không dính closure cũ khi đổi kênh
      getMyId: () => store.getState().auth.user?.id,
      getActiveChannelId: () => store.getState().chatUi.activeChannelId,
      markRead: (channelId) => debounced.call(channelId),
    }),
    [queryClient, store, debounced],
  )

  useEffect(() => registerChatRealtimeHandlers(router, ctx), [router, ctx])
  useEffect(
    () =>
      client.onConnected(({ isReconnect }) => {
        if (isReconnect) syncChatAfterReconnect(ctx)
      }),
    [client, ctx],
  )

  return null
}
