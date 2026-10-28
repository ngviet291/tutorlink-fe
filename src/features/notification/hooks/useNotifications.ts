import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { notificationService } from '../service/notification.service'

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: notificationService.getNotifications,
    enabled,
    refetchInterval: 30_000,
  })
}

export function useNotificationMutations() {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: queryKeys.notifications.all })
  return {
    markRead: useMutation({ mutationFn: (id: string) => notificationService.markRead(id), onSuccess: refresh }),
    markAll: useMutation({ mutationFn: () => notificationService.markAllRead(), onSuccess: refresh }),
  }
}
