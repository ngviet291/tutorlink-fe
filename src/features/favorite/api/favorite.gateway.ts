import type { TutorResponse } from "@/features/tutor/types/tutor.types";

export interface FavoriteGateway {
  getFavoriteIds(): Promise<string[]>;
  getFavorites(): Promise<TutorResponse[]>;
  addFavorite(tutorId: string): Promise<void>;
  removeFavorite(tutorId: string): Promise<void>;
}
