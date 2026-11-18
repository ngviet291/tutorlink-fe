import { adminComplaintsService, type ComplaintStatus } from "../service/admin.complaints.service";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { adminService, type AdminUserFilter } from "../service/admin.service";
import type { AdminPostFilter } from "@/features/post/types/post.types";
import type { AccountStatus } from "@/shared/types/common.types";
import type {
  ProfileReviewPayload,
} from "../types/admin.types";
import { postService } from "@/config/di/container";

export const adminKeys = {
  all: ["admin"] as const,
  users: ["admin", "users"] as const,
  pendingTutors: ["admin", "tutors", "pending"] as const,
  posts: ["admin", "posts"] as const,
  transactions: ["admin", "transactions"] as const,
  feeRates: ["admin", "fee-rates"] as const,
  complaints: ["admin", "complaints"] as const,
  stats: ["admin", "stats"] as const,
};

export function useAdminUsers(params: Omit<AdminUserFilter, "cursor"> = {}) {
  return useInfiniteQuery({
    queryKey: [...adminKeys.users, "list", params],
    queryFn: ({ pageParam }) =>
      adminService.getUsers({ ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.hasNext ? (last.nextCursor ?? undefined) : undefined,
  });
}

/** GET /v1/users/{id} — chi tiết người dùng cho admin. */
export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: [...adminKeys.users, "detail", id],
    queryFn: () => adminService.getUserById(id ?? ""),
    enabled: Boolean(id),
  });
}

export function usePendingTutors() {
  return useQuery({
    queryKey: adminKeys.pendingTutors,
    queryFn: () => adminService.getPendingTutors(),
  });
}

export function useAdminPosts(filter: Omit<AdminPostFilter, "cursor"> = {}) {
  return useInfiniteQuery({
    queryKey: [...adminKeys.posts, "list", filter],
    queryFn: ({ pageParam }) =>
      postService.getAdminPosts({
        ...filter,
        status: filter.status || undefined, // "" thì bỏ khỏi query
        cursor: pageParam,
        limit: 20,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.hasNext ? (last.nextCursor ?? undefined) : undefined,
    staleTime: 0, // Luôn fetch mới, không dùng cache
  });
}

export function useAdminPostDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...adminKeys.posts, "detail", id],
    queryFn: () => postService.getPostByIdForAdmin(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useComplaints(status?: ComplaintStatus) {
  return useQuery({
    queryKey: [...adminKeys.complaints, status],
    queryFn: () => adminComplaintsService.getComplaints(status),
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: adminKeys.stats,
    queryFn: () => adminService.getStats(),
  });
}

export function useAdminMutations() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: adminKeys.all });

  return {
    setUserStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: AccountStatus }) =>
        adminService.setUserStatus(id, status),
      onSuccess: refresh,
    }),
    reviewTutor: useMutation({
      mutationFn: ({
        id,
        payload,
      }: {
        id: string;
        payload: ProfileReviewPayload;
      }) => adminService.reviewTutor(id, payload),
      onSuccess: () => {
        void refresh();
        void qc.invalidateQueries({ queryKey: ["tutors"] });
      },
    }),
    removePost: useMutation({
      mutationFn: ({ id, reason }: { id: string; reason: string }) =>
        postService.removePostByAdmin(id, reason),
      onSuccess: () => {
        void refresh();
        void qc.invalidateQueries({ queryKey: ["posts"] });
        void qc.invalidateQueries({ queryKey: ["subjects"] });
      },
    }),
    decideComplaint: useMutation({
      mutationFn: ({ complaintId, status }: { complaintId: string; status: 'APPROVED' | 'REJECTED' }) =>
        adminComplaintsService.resolve(complaintId, status),
      onSuccess: () => {
        void refresh();
        void qc.invalidateQueries({ queryKey: ["reviews"] });
        void qc.invalidateQueries({ queryKey: ["tutors"] });
      },
    }),
  };
}

