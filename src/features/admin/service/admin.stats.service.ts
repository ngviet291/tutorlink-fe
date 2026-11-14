import { http } from "@/config/axiosClient";
import type { AcceptedPointResponse, RevenuePointResponse, TopTutorResponse } from "../types/statistics.dto";
import type { AdminStats } from "../types/admin.types";
export interface StatisticsRange { from: string; to: string; timeDetail: 'DAY' | 'WEEK' | 'MONTH' }
export const adminStatsService = {
  async getRevenue(range: StatisticsRange) { return (await http.get<RevenuePointResponse[]>("/v1/statistics/revenue", { params: range })).data; },
  async getAccepted(range: StatisticsRange) { return (await http.get<AcceptedPointResponse[]>("/v1/statistics/applications/accepted/series", { params: range })).data; },
  async getTopTutors(range: {from?: string; to?: string; limit?: number}) { return (await http.get<TopTutorResponse[]>("/v1/statistics/top-tutors", { params: range })).data; },
  async getStats(): Promise<AdminStats> {
    const now = new Date();
    const localDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const range: StatisticsRange = { from: localDate(new Date(now.getFullYear(), now.getMonth()-5, 1)), to: localDate(now), timeDetail: 'MONTH' };
    const [revenue, accepted, tutors] = await Promise.all([
      adminStatsService.getRevenue(range), adminStatsService.getAccepted(range), adminStatsService.getTopTutors({from:range.from,to:range.to,limit:5})]);
    return { revenueByMonth: revenue.map(p=>({label:p.periodStart, revenue:Number(p.totalRevenue)})),
      totalSuccessfulMatches: accepted.reduce((n,p)=>n+Number(p.totalAccepted),0),
      topTutors: tutors.map(t=>({tutorId:t.tutorId, fullName:t.fullName, matchCount:Number(t.acceptedCount)})), postsByStatus: [] };
  },
};
