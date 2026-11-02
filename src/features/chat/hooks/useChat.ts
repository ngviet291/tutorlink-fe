import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { chatService } from '../service/chat.service'

export function useChatRoom(applicationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chat.room(applicationId ?? ''),
    queryFn: () => chatService.getRoom(applicationId ?? ''),
    enabled: Boolean(applicationId),
    refetchInterval: 10_000,
    retry: false,
  })
}

export function useSendMessage(applicationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => chatService.sendMessage(applicationId, content),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.chat.room(applicationId) })
      void qc.invalidateQueries({ queryKey: queryKeys.chat.inbox })
    },
  })
}

export function useChatInbox(enabled = true) {
  return useQuery({ queryKey: queryKeys.chat.inbox, queryFn: () => chatService.getInbox(), enabled, refetchInterval: 15_000 })
}

export function useUnreadChatCount(enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.chat.inbox, 'unread'],
    queryFn: () => chatService.getUnreadCount(),
    enabled,
    refetchInterval: 15_000,
  })
}
