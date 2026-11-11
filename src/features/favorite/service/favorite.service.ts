import { http } from "@/config/axiosClient";
import { mockConfig } from "@/config/env";
import { toTutor } from "@/features/user/mapper/user.mapper";
import type { TutorResponse as TutorResponseDto } from "@/features/user/types/user.dto";
import type { TutorResponse } from "@/features/tutor/types/tutor.types";
import { favorites, tutors } from "@/mocks/db";
import { delay, requireUser } from "@/mocks/session";
import type { FavoriteResponse } from "../types/favorite.dto";

const USE_MOCK = mockConfig.favorite;

/** GET /v1/favorites → chỉ trả [{ tutorId }]. */
async function fetchFavoriteIds(): Promise<string[]> {
  const res = await http.get<FavoriteResponse[]>("/v1/favorites");
  return (res.data ?? []).map((f) => f.tutorId);
}

export const favoriteService = {
  /** Chỉ lấy danh sách id gia sư đã yêu thích (nhẹ, dùng để tô trái tim). */
  async getFavoriteIds(): Promise<string[]> {
    if (USE_MOCK) {
      await delay(100);
      return [...(favorites[requireUser().id] ?? [])];
    }
    return fetchFavoriteIds();
  },

  /**
   * Danh sách gia sư yêu thích đầy đủ. BE chỉ trả tutorId nên FE gọi thêm
   * GET /v1/users/{id}/public-profile cho từng id; hồ sơ không còn công khai
   * (404/400) bị bỏ qua thay vì làm hỏng cả trang.
   */
  async getFavorites(): Promise<TutorResponse[]> {
    if (USE_MOCK) {
      await delay(250);
      const me = requireUser();
      const ids = favorites[me.id] ?? [];
      return tutors
        .filter(
          (t) => ids.includes(t.id) && t.verificationStatus === "APPROVED",
        )
        .map((t) => ({ ...t, contact: undefined }));
    }
    const ids = await fetchFavoriteIds();
    const results = await Promise.allSettled(
      ids.map((id) =>
        http.get<TutorResponseDto>(`/v1/users/${id}/public-profile`),
      ),
    );
    return results.flatMap((r) =>
      r.status === "fulfilled" ? [toTutor(r.value.data)] : [],
    );
  },

  /**
   * BE không có toggle: POST /v1/favorites/{tutorId} để thêm,
   * DELETE /v1/favorites/{tutorId} để bỏ. Hỏi BE trạng thái hiện tại để không lệch cache.
   */
  async toggleFavorite(tutorId: string): Promise<{ favorited: boolean }> {
    if (USE_MOCK) {
      await delay(150);
      const me = requireUser();
      const list = favorites[me.id] ?? [];
      const has = list.includes(tutorId);
      favorites[me.id] = has
        ? list.filter((x) => x !== tutorId)
        : [...list, tutorId];
      return { favorited: !has };
    }
    const has = (await fetchFavoriteIds()).includes(tutorId);
    if (has) {
      await http.delete(`/v1/favorites/${tutorId}`);
      return { favorited: false };
    }
    await http.post<FavoriteResponse>(`/v1/favorites/${tutorId}`);
    return { favorited: true };
  },
};
