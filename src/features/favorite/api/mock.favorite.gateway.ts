import type { TutorResponse } from "@/features/tutor/types/tutor.types";
import { favorites, tutors } from "@/mocks/db";
import { delay, requireUser } from "@/mocks/session";
import type { FavoriteGateway } from "./favorite.gateway";

export class MockFavoriteGateway implements FavoriteGateway {
  async getFavoriteIds(): Promise<string[]> {
    await delay(100);
    return [...(favorites[requireUser().id] ?? [])];
  }

  async getFavorites(): Promise<TutorResponse[]> {
    await delay(250);
    const ids = favorites[requireUser().id] ?? [];
    return tutors
      .filter((t) => ids.includes(t.id) && t.verificationStatus === "APPROVED")
      .map((t) => ({ ...t, contact: undefined }));
  }

  async addFavorite(tutorId: string): Promise<void> {
    await delay(150);
    const me = requireUser();
    const list = favorites[me.id] ?? [];
    if (!list.includes(tutorId)) favorites[me.id] = [...list, tutorId];
  }

  async removeFavorite(tutorId: string): Promise<void> {
    await delay(150);
    const me = requireUser();
    favorites[me.id] = (favorites[me.id] ?? []).filter((x) => x !== tutorId);
  }
}
