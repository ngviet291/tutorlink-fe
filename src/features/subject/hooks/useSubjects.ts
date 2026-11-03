import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { subjectService } from "@/config/di/container";
import type { SubjectRequest } from "../types/subject.dto";
import type { SubjectResponse } from "../types/subject.types";

// Môn học ít thay đổi nên cache lâu.
const SUBJECT_STALE_TIME = 30 * 60 * 1000; // 30 phút không gọi lại API
const SUBJECT_GC_TIME = 60 * 60 * 1000; // giữ 1 giờ trong bộ nhớ

/** Toàn bộ môn học dạng mảng phẳng (giữ nguyên API cũ cho các nơi đang dùng). */
export function useSubjects() {
  return useQuery({
    queryKey: queryKeys.subjects.all,
    queryFn: () => subjectService.getAll(),
    staleTime: SUBJECT_STALE_TIME,
    gcTime: SUBJECT_GC_TIME,
  });
}

/** Danh sách phân trang kiểu cursor (cho trang admin, infinite scroll). */
export function useSubjectsInfinite(limit = 10) {
  return useInfiniteQuery({
    queryKey: [...queryKeys.subjects.all, "infinite", limit],
    queryFn: ({ pageParam }) =>
      subjectService.getPage({ cursor: pageParam, limit }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.hasNext ? (last.nextCursor ?? undefined) : undefined,
    staleTime: SUBJECT_STALE_TIME,
    gcTime: SUBJECT_GC_TIME,
  });
}

/** Chi tiết một môn học; ưu tiên lấy từ danh sách đã cache để khỏi gọi API. */
export function useSubject(id: string | undefined) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: [...queryKeys.subjects.all, "detail", id],
    queryFn: () => subjectService.getById(id as string),
    enabled: !!id,
    staleTime: SUBJECT_STALE_TIME,
    gcTime: SUBJECT_GC_TIME,
    initialData: () =>
      qc
        .getQueryData<SubjectResponse[]>(queryKeys.subjects.all)
        ?.find((s) => s.id === id),
    initialDataUpdatedAt: () =>
      qc.getQueryState(queryKeys.subjects.all)?.dataUpdatedAt,
  });
}

/** Tạo / sửa / xoá môn học — chỉ ADMIN. Xong thì làm mới mọi cache môn học. */
export function useSubjectMutations() {
  const qc = useQueryClient();
  const refresh = () =>
    qc.invalidateQueries({ queryKey: queryKeys.subjects.all });

  const create = useMutation({
    mutationFn: (req: SubjectRequest) => subjectService.create(req),
    onSuccess: refresh,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SubjectRequest }) =>
      subjectService.update(id, payload),
    onSuccess: refresh,
  });

  const remove = useMutation({
    mutationFn: (id: string) => subjectService.remove(id),
    onSuccess: refresh,
  });

  return { create, update, remove };
}
