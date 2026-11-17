import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { tutorService } from "@/config/di/container";
import type { TutorFilter, TutorProfilePayload } from "../types/tutor.types";
const CERTIFICATE_POLL_MS = 5000;
export function useTutors(params: Omit<TutorFilter, "cursor"> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.tutors.list(params),
    queryFn: ({ pageParam }) =>
      tutorService.getTutors({
        ...params,
        cursor: pageParam as string | undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.hasNext ? (last.nextCursor ?? undefined) : undefined,
  });
}

export function useTutor(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tutors.detail(id ?? ""),
    queryFn: () => tutorService.getTutorById(id ?? ""),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useMyTutorProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.tutors.me,
    queryFn: () => tutorService.getMyProfile(),
    enabled,
  });
}

export function useMyCertificates(enabled = true) {
  return useQuery({
    queryKey: queryKeys.tutors.certificates,
    queryFn: () => tutorService.getMyCertificates(),
    enabled,
    // còn chứng chỉ chờ AI duyệt thì tự làm mới, xong hết thì dừng
    refetchInterval: (query) =>
      query.state.data?.some((c) => !c.verified) ? CERTIFICATE_POLL_MS : false,
  });
}

export function useUploadCertificates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (files: File[]) => tutorService.uploadCertificates(files),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tutors.all }),
  });
}

export function useDeleteCertificate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tutorService.deleteCertificate(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.tutors.certificates }),
  });
}
export function useSaveTutorProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: TutorProfilePayload) => tutorService.saveMyProfile(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tutors.all }),
  });
}
