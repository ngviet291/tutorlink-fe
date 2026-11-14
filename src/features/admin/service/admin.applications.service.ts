import { http } from "@/config/axiosClient";
import type { CursorResponse } from "@/shared/types/api.types";
export type ApplicationStatus = 'PENDING'|'ACCEPTED'|'CONFIRMED'|'FINISHED'|'CANCELLED'|'REJECTED';
export interface AdminApplication { id:string; postId:string; studentId:string; tutorId:string; applicationStatus:ApplicationStatus; message?:string; appliedAt:string; transactionId?:string; processedByAdminId?:string }
export interface AdminApplicationFilter { status?:ApplicationStatus; cursor?:string; limit?:number }
export const adminApplicationsService = {
  async getApplications(params: AdminApplicationFilter = {}): Promise<CursorResponse<AdminApplication>> {
    return (await http.get<CursorResponse<AdminApplication>>("/v1/applications", { params })).data;
  },
};
