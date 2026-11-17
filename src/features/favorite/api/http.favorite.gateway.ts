import type { IHttpClient } from "@/config/http/IHttpClient";
import type { TutorResponse } from "@/features/tutor/types/tutor.types";
import type { FavoriteResponse } from "../types/favorite.dto";
import { toTutorFromFavorite } from "../mapper/favorite.mapper";
import type { FavoriteGateway } from "./favorite.gateway";

const FAVORITES = "/v1/favorites";
export class HttpFavoriteGateway implements FavoriteGateway {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
  }
  private async fetchAll(): Promise<FavoriteResponse[]> {
    return (await this.http.get<FavoriteResponse[]>(FAVORITES)) ?? [];
  }

  async getFavoriteIds(): Promise<string[]> {
    return (await this.fetchAll()).map((f) => f.tutorId);
  }

  async getFavorites(): Promise<TutorResponse[]> {
    return (await this.fetchAll()).map(toTutorFromFavorite);
  }

  async addFavorite(tutorId: string): Promise<void> {
    await this.http.post<FavoriteResponse>(`${FAVORITES}/${tutorId}`);
  }

  async removeFavorite(tutorId: string): Promise<void> {
    await this.http.delete(`${FAVORITES}/${tutorId}`);
  }
}
