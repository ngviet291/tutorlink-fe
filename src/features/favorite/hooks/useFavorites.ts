import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { track } from '@/features/tracking/tracker'
import { favoriteService } from '../service/favorite.service'

export function useFavorites(enabled = true) {
  return useQuery({
    queryKey: queryKeys.favorites.mine,
    queryFn: () => favoriteService.getFavorites(),
    enabled,
  })
}

export function useToggleFavorite(source: string = 'unknown') {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tutorId: string) => favoriteService.toggleFavorite(tutorId),
    onSuccess: (result, tutorId) => {
      qc.invalidateQueries({ queryKey: queryKeys.favorites.all })
      // Track event khi user favorite gia sư
      if (result.favorited) {
        track('tutor_favorited', { tutorId, source })
      }
    },
  })
}

export function useIsFavorite(tutorId: string) {
  const { data } = useFavorites()
  return data?.some((t) => t.id === tutorId) ?? false
}
