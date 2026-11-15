export interface FavoriteResponse {
  tutorId: string;
  fullName?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  experienceYears?: number;
  hourlyRate?: number;
  averageRating?: number;
  verificationStatus?: string;
  province?: string | null;
  subjects?: { id: string; name: string }[];
}
