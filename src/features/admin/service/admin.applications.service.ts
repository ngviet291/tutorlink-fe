import { http } from "@/config/axiosClient";
import type { CursorResponse } from "@/shared/types/api.types";
export type ApplicationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "CONFIRMED"
  | "FINISHED"
  | "CANCELLED"
  | "REJECTED";
export interface AdminApplicationUser {
  id: string;
  fullName: string;
  avatarUrl?: string;
}
export interface AdminApplication {
  id: string;
  postId: string;
  studentId: string;
  tutorId: string;
  student?: AdminApplicationUser;
  tutor?: AdminApplicationUser;
  applicationStatus: ApplicationStatus;
  message?: string;
  appliedAt: string;
  expiresAt?: string;
  selectedAt?: string;
  feeAmount?: number;
  proposedFee?: number;
  transactionId?: string;
  transactionStatus?: string;
  processedByAdminId?: string;
  paidAt?: string;
}
export interface AdminApplicationFilter {
  status?: ApplicationStatus;
  cursor?: string;
  limit?: number;
}
export const adminApplicationsService = {
  async getApplications(
    params: AdminApplicationFilter = {},
  ): Promise<CursorResponse<AdminApplication>> {
    return (
      await http.get<CursorResponse<AdminApplication>>("/v1/applications", {
        params,
      })
    ).data;
  },
};
