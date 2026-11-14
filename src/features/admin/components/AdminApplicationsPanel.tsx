import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { adminApplicationsService, type ApplicationStatus } from '../service/admin.applications.service';
import { Button } from '@/shared/components/ui/Button';
import { Select } from '@/shared/components/ui/Select';
import { EmptyState, ErrorState } from '@/shared/components/ui/EmptyState';
import { ListSkeleton } from '@/shared/components/ui/Skeleton';
import { formatDateTime } from '@/shared/utils/date';
const states: {value: ApplicationStatus; label:string}[] = [
  {value:'PENDING',label:'Chờ xử lý'}, {value:'ACCEPTED',label:'Đã chấp nhận'},
  {value:'CONFIRMED',label:'Đã xác nhận'}, {value:'FINISHED',label:'Đã hoàn thành'},
  {value:'CANCELLED',label:'Đã hủy'}, {value:'REJECTED',label:'Đã từ chối'}];
export function AdminApplicationsPanel() {
  const [status,setStatus] = useState<ApplicationStatus | ''>('');
  const query = useInfiniteQuery({ queryKey:['admin','applications',status],
    queryFn:({pageParam})=>adminApplicationsService.getApplications({status:status || undefined,cursor:pageParam,limit:10}),
    initialPageParam:undefined as string | undefined, getNextPageParam:p=>p.hasNext?p.nextCursor:undefined });
  const rows=query.data?.pages.flatMap(p=>p.content) ?? [];
  return <section className="rounded-2xl border border-border bg-surface p-4">
    <h2 className="mb-3 text-lg font-bold">Đơn ứng tuyển</h2>
    <Select aria-label="Trạng thái đơn" placeholder="Tất cả trạng thái" value={status} options={states} onChange={e=>setStatus(e.target.value as ApplicationStatus | '')} />
    {query.isLoading ? <ListSkeleton /> : query.isError ? <ErrorState onRetry={()=>void query.refetch()} /> : !rows.length ? <EmptyState title="Không có đơn ứng tuyển" /> :
      <div className="my-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th>Mã đơn</th><th>Gia sư</th><th>Ngày ứng tuyển</th><th>Trạng thái</th><th>Giao dịch phí</th></tr></thead>
      <tbody>{rows.map(a=><tr key={a.id} className="border-t border-border"><td className="py-3">{a.id}</td><td>{a.tutorId}</td><td>{formatDateTime(a.appliedAt)}</td><td>{states.find(s=>s.value===a.applicationStatus)?.label ?? a.applicationStatus}</td><td>{a.transactionId ?? '—'}</td></tr>)}</tbody></table></div>}
    {query.hasNextPage && <Button loading={query.isFetchingNextPage} onClick={()=>void query.fetchNextPage()}>Tải thêm đơn</Button>}
  </section>;
}
