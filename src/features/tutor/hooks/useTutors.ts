import { useCallback, useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { tutorService } from "@/config/di/container";
import { useAppDispatch, useAppSelector } from "@/shared/hooks/useAppStore";
import {
  selectTutorProfile,
  setTutorProfile,
} from "../store/tutorProfileSlice";
import { loadTutorProfile } from "../store/loadTutorProfile";
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

/** Hồ sơ gia sư của người đang đăng nhập, đọc từ Redux (được nạp lúc login / F5). null nếu không phải TUTOR. */
export function useTutorProfile() {
  return useAppSelector(selectTutorProfile);
}

/** Tải lại hồ sơ gia sư từ BE rồi ghi vào Redux (dùng khi cần dữ liệu mới nhất hoặc bấm "Thử lại"). */
export function useReloadTutorProfile() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [isError, setIsError] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;
    setIsError(false);
    const profile = await loadTutorProfile(user);
    if (profile) dispatch(setTutorProfile(profile));
    else setIsError(true);
  }, [user, dispatch]);

  return { reload, isError };
}

export function useMyCertificates(enabled = true) {
  return useQuery({
    queryKey: queryKeys.tutors.certificates,
    queryFn: () => tutorService.getMyCertificates(),
    enabled,
    // còn chứng chỉ chờ AI duyệt thì tự làm mới; chờ admin duyệt thì không cần poll
    refetchInterval: (query) =>
      query.state.data?.some((c) => !c.verified && !c.pendingAdminReview)
        ? CERTIFICATE_POLL_MS
        : false,
  });
}

export function useUploadCertificates() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ subjectId, files }: { subjectId: string; files: File[] }) =>
      tutorService.uploadCertificates(subjectId, files),
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
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (p: TutorProfilePayload) => tutorService.saveMyProfile(p),
    onSuccess: (profile) => {
      dispatch(setTutorProfile(profile)); // giữ bản trong Redux khớp với hồ sơ vừa lưu
      return qc.invalidateQueries({ queryKey: queryKeys.tutors.all });
    },
  });
}
