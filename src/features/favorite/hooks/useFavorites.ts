import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { track } from "@/features/tracking/tracker";
import { favoriteService } from "../service/favorite.service";

export function useFavorites(enabled = true) {
  return useQuery({
    queryKey: queryKeys.favorites.mine,
    queryFn: () => favoriteService.getFavorites(),
    enabled,
  });
}

/** Chỉ danh sách id — dùng cho nút trái tim, không cần tải cả hồ sơ. */
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
    mutationFn: (tutorId: string) => favoriteService.toggleFavorite(tutorId),
    onSuccess: (result, tutorId) => {
      qc.invalidateQueries({ queryKey: queryKeys.favorites.all });
      // Track event khi user favorite gia sư
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
