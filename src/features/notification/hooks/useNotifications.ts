import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { notificationService } from '../service/notification.service'

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.mine,
    queryFn: notificationService.getMyNotifications,
    enabled,
    refetchInterval: 30_000,
  })
}

export function useMarkAllRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notificationService.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  })
}

export function useMarkRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all }),
  })
}

export function useNotificationMutations() {
  const markAll = useMarkAllRead()
  const markRead = useMarkRead()
  return { markAll, markRead }
}
