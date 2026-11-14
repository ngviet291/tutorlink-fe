import { http } from "@/config/axiosClient";
export type ComplaintStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export interface ComplaintDto { id: string; reason: string; status: ComplaintStatus; reviewId: string; tutorId: string; adminId?: string }
export const adminComplaintsService = {
  async getComplaints(status?: ComplaintStatus): Promise<ComplaintDto[]> {
    return (await http.get<ComplaintDto[]>("/v1/review-complaints", { params: { status } })).data;
  },
  async resolve(id: string, status: Exclude<ComplaintStatus, 'PENDING'>): Promise<ComplaintDto> {
    return (await http.patch<ComplaintDto>(`/v1/review-complaints/${id}/resolve`, { status })).data;
  },
};
