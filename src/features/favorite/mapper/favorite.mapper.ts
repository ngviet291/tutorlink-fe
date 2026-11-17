import type { TutorResponse } from "@/features/tutor/types/tutor.types";
import type { FavoriteResponse } from "../types/favorite.dto";

export function toTutorFromFavorite(f: FavoriteResponse): TutorResponse {
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
