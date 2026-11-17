import type { TutorResponse } from "@/features/tutor/types/tutor.types";
import type { FavoriteGateway } from "../api/favorite.gateway";
export class FavoriteService {
  private readonly gateway: FavoriteGateway;

  constructor(gateway: FavoriteGateway) {
    this.gateway = gateway;
  }

  getFavoriteIds(): Promise<string[]> {
    return this.gateway.getFavoriteIds();
  }

  getFavorites(): Promise<TutorResponse[]> {
    return this.gateway.getFavorites();
  }

  async toggleFavorite(
    tutorId: string,
    knownFavorited?: boolean,
  ): Promise<{ favorited: boolean }> {
    const has =
      knownFavorited ?? (await this.gateway.getFavoriteIds()).includes(tutorId);
    if (has) {
      await this.gateway.removeFavorite(tutorId);
      return { favorited: false };
    }
    await this.gateway.addFavorite(tutorId);
    return { favorited: true };
  }
}
