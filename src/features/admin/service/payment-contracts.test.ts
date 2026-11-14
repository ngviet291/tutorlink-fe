import { beforeEach, expect, it, vi } from 'vitest';
const http=vi.hoisted(()=>({get:vi.fn(),post:vi.fn(),patch:vi.fn()}));
vi.mock('@/config/axiosClient',()=>({http}));
import {walletService} from '@/features/wallet/service/wallet.service';
import {adminPaymentService,mapFeeConfig} from './admin.payment.service';
import {adminComplaintsService} from './admin.complaints.service';
import {adminStatsService} from './admin.stats.service';
import {adminApplicationsService} from './admin.applications.service';
const tx={id:'tx',type:'TOP_UP',amount:50000,status:'PENDING',transactionDate:'2026-11-14T00:00:00Z',paymentLink:'https://example.invalid/pay'};
beforeEach(()=>vi.resetAllMocks());
it('top-up sends amount only and maps links without fabricated bank fields',async()=>{
 http.post.mockResolvedValue({data:tx});const r=await walletService.topUp({amount:50000,paymentMethod:'MOMO'});
 expect(http.post).toHaveBeenCalledWith('/v1/payments/wallet/top-up',{amount:50000},{timeout:45000});expect(r.transaction.transactionStatus).toBe('PENDING');expect(r.paymentLink).toBe(tx.paymentLink);expect(r).not.toHaveProperty('bankName');
});
it('admin transactions preserve cursor and map DTO',async()=>{
 http.get.mockResolvedValue({data:{content:[tx],hasNext:true,nextCursor:'next'}});
 const r=await adminPaymentService.getTransactions({status:'SUCCESS',cursor:'prev',limit:10});
 expect(http.get).toHaveBeenCalledWith('/v1/payments',{params:{status:'SUCCESS',cursor:'prev',limit:10}});expect(r.nextCursor).toBe('next');expect(r.content[0].createdAt).toBe(tx.transactionDate);
});
it('history omits unsupported status filter',async()=>{
 http.get.mockResolvedValue({data:{content:[],hasNext:false}});await walletService.getTransactions({transactionStatus:'FAILED',limit:10});
 expect(http.get).toHaveBeenCalledWith('/v1/payments/history',{params:{cursor:undefined,limit:10}});
});
it('revenue passes the requested dates',async()=>{
 http.get.mockResolvedValue({data:{}});await adminPaymentService.getRevenueStatistics({from:'2026-01-01',to:'2026-02-01'});
 expect(http.get).toHaveBeenCalledWith('/v1/payments/statistics/revenue',{params:{from:'2026-01-01',to:'2026-02-01'}});
});
it('fee history loads all pages and rejects repeated cursor',async()=>{
 http.get.mockResolvedValueOnce({data:{content:[],hasNext:true,nextCursor:'n'}}).mockResolvedValueOnce({data:{content:[],hasNext:false}});
 await expect(adminPaymentService.getFeeRates()).resolves.toEqual([]);expect(http.get).toHaveBeenLastCalledWith('/v1/payments/fee-configs',{params:{cursor:'n',limit:50}});
 http.get.mockResolvedValue({data:{content:[],hasNext:true,nextCursor:'repeat'}});await expect(adminPaymentService.getFeeRates()).rejects.toThrow('Không thể tải tiếp');
});
it('fee percentage and effective dates are mapped correctly',async()=>{
 const f={id:'f',feePercentage:0.2,fixedFee:100,effectiveFrom:'2099-01-01',createdAt:'2026-01-01'};
 http.post.mockResolvedValue({data:f});await adminPaymentService.createFeeRate({ratePercent:20,fixedFee:100,effectiveFrom:'2099-01-01'});
 expect(http.post).toHaveBeenCalledWith('/v1/payments/fee-configs',{feePercentage:0.2,fixedFee:100,effectiveFrom:'2099-01-01'});expect(mapFeeConfig(f,'2026-01-01').active).toBe(false);
});
it('API failures never turn into mock success',async()=>{
 http.post.mockRejectedValue(new Error('forbidden'));await expect(walletService.payCommission('app')).rejects.toThrow('forbidden');
 http.get.mockRejectedValue(new Error('404'));await expect(walletService.getFeeQuote('app')).rejects.toThrow('404');expect(http.get).toHaveBeenCalledWith('/v1/payments/applications/app/fee-quote');
});
it('uses detail, status, payment and refund contracts',async()=>{
 http.get.mockResolvedValue({data:tx});http.post.mockResolvedValue({data:tx});await walletService.getTransaction('tx');await walletService.getTopUpStatus('tx');await walletService.payCommission('app');await adminPaymentService.refundTransaction('tx');
 expect(http.get).toHaveBeenCalledWith('/v1/payments/tx');expect(http.get).toHaveBeenCalledWith('/v1/payments/wallet/top-up/tx',{timeout:45000});expect(http.post).toHaveBeenCalledWith('/v1/payments/applications/app/pay');expect(http.post).toHaveBeenCalledWith('/v1/payments/tx/refund');
});
it('complaints use complaint ID, PATCH and actual statuses',async()=>{
 http.patch.mockResolvedValue({data:{}});await adminComplaintsService.resolve('complaint','APPROVED');expect(http.patch).toHaveBeenCalledWith('/v1/review-complaints/complaint/resolve',{status:'APPROVED'});
 http.get.mockResolvedValue({data:[]});await adminComplaintsService.getComplaints('PENDING');expect(http.get).toHaveBeenCalledWith('/v1/review-complaints',{params:{status:'PENDING'}});
});
it('statistics use separate endpoints without fabricated totals',async()=>{
 http.get.mockImplementation((p:string)=>Promise.resolve({data:p==='/v1/statistics/revenue'?[{periodStart:'2026-11-01',totalRevenue:500}]:p.includes('accepted/series')?[{totalAccepted:2}]:[{tutorId:'t',fullName:'Tutor',acceptedCount:2}]}));
 const s=await adminStatsService.getStats();expect(s.totalSuccessfulMatches).toBe(2);expect(s.revenueByMonth[0].revenue).toBe(500);expect(s.topTutors[0].matchCount).toBe(2);expect(http.get.mock.calls.every(c=>c[1].params.from&&c[1].params.to)).toBe(true);
});
it('admin applications send cursor/status/limit',async()=>{
 http.get.mockResolvedValue({data:{content:[],hasNext:false}});await adminApplicationsService.getApplications({status:'ACCEPTED',cursor:'n',limit:10});expect(http.get).toHaveBeenCalledWith('/v1/applications',{params:{status:'ACCEPTED',cursor:'n',limit:10}});
});
