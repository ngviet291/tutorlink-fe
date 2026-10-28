import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { favoriteService } from '../service/favorite.service'

export function useFavorites(enabled = true) {
  return useQuery({ queryKey: queryKeys.favorites.all, queryFn: favoriteService.getFavorites, enabled })
}

export function useToggleFavorite() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (tutorId: string) => favoriteService.toggleFavorite(tutorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.favorites.all }),
  })
}
