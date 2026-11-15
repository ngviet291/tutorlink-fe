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
function favoriteToTutor(f: FavoriteResponse): TutorResponse {
  const subjects = f.subjects ?? [];
  return {
    id: f.tutorId,
    fullName: f.fullName ?? "",
    avatarUrl: f.avatarUrl ?? undefined,
    bio: f.bio ?? undefined,
    experienceYears: f.experienceYears ?? 0,
    hourlyRate: f.hourlyRate ?? 0,
    averageRating: f.averageRating ?? 0,
    verificationStatus: (f.verificationStatus ??
      "APPROVED") as TutorResponse["verificationStatus"],
    subject: subjects[0] as TutorResponse["subject"],
    subjects,
    address: f.province
      ? ({ province: f.province } as TutorResponse["address"])
      : undefined,
  };
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
    const res = await http.get<FavoriteResponse[]>("/v1/favorites");
    return (res.data ?? []).map(favoriteToTutor);
  },

  /**
   * BE không có toggle: POST /v1/favorites/{tutorId} để thêm, DELETE /v1/favorites/{tutorId} để bỏ.
   * `knownFavorited` là trạng thái UI đang biết (từ cache). Cả POST lẫn DELETE của BE đều idempotent
   * (thêm trùng / xóa cái không có đều không lỗi) nên cache cũ cũng không gây hại.
   * Không truyền thì mới phải hỏi BE (GET /v1/favorites).
   */
  async toggleFavorite(
    tutorId: string,
    knownFavorited?: boolean,
  ): Promise<{ favorited: boolean }> {
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
    const has = knownFavorited ?? (await fetchFavoriteIds()).includes(tutorId);
    if (has) {
      await http.delete(`/v1/favorites/${tutorId}`);
      return { favorited: false };
    }
    await http.post<FavoriteResponse>(`/v1/favorites/${tutorId}`);
    return { favorited: true };
  },
};
