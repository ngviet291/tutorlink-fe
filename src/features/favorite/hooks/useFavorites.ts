import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { track } from "@/features/tracking/tracker";
import { favoriteService } from "@/config/di/container";

export function useFavorites(enabled = true) {
  return useQuery({
    queryKey: queryKeys.favorites.mine,
    queryFn: () => favoriteService.getFavorites(),
    enabled,
  });
}

export function useFavoriteIds(enabled = true) {
  return useQuery({
    queryKey: queryKeys.favorites.ids,
    queryFn: () => favoriteService.getFavoriteIds(),
    enabled,
  });
}

export function useToggleFavorite(source: string = "unknown") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tutorId: string) =>
      favoriteService.toggleFavorite(
        tutorId,
        qc.getQueryData<string[]>(queryKeys.favorites.ids)?.includes(tutorId),
      ),
    onSuccess: (result, tutorId) => {
      qc.invalidateQueries({ queryKey: queryKeys.favorites.all });
      if (result.favorited) {
        track("tutor_favorited", { tutorId, source });
      }
    },
  });
}

export function useIsFavorite(tutorId: string) {
  const { data } = useFavoriteIds();
  return data?.includes(tutorId) ?? false;
}
