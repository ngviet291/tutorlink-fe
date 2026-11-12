import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { adminService, type AdminUserFilter } from "../service/admin.service";
import type { AdminPostFilter } from "@/features/post/types/post.types";
import type { AdminTransactionFilter } from "@/features/wallet/types/wallet.types";
import type { AccountStatus } from "@/shared/types/common.types";
import type {
  ComplaintDecisionPayload,
  FeeRatePayload,
  ProfileReviewPayload,
} from "../types/admin.types";
import { queryKeys } from "@/constants/queryKeys";
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
  });
}

export function useAdminPostDetail(id: string | undefined) {
  return useQuery({
    queryKey: [...adminKeys.posts, "detail", id],
    queryFn: () => postService.getPostByIdForAdmin(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useAdminTransactions(params: AdminTransactionFilter = {}) {
  return useQuery({
    queryKey: [...adminKeys.transactions, params],
    queryFn: () => adminService.getTransactions(params),
  });
}

export function useFeeRates() {
  return useQuery({
    queryKey: adminKeys.feeRates,
    queryFn: () => adminService.getFeeRates(),
  });
}

export function useComplaints() {
  return useQuery({
    queryKey: adminKeys.complaints,
    queryFn: () => adminService.getComplaints(),
  });
}

export function useRevenueStatistics(
  range: { from?: string; to?: string } = {},
) {
  return useQuery({
    queryKey: [...adminKeys.transactions, "revenue", range],
    queryFn: () => adminService.getRevenueStatistics(range),
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
    refundTransaction: useMutation({
      mutationFn: (id: string) => adminService.refundTransaction(id),
      onSuccess: refresh,
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
    createFeeRate: useMutation({
      mutationFn: (payload: FeeRatePayload) =>
        adminService.createFeeRate(payload),
      onSuccess: refresh,
    }),
    decideComplaint: useMutation({
      mutationFn: ({
        reviewId,
        payload,
      }: {
        reviewId: string;
        payload: ComplaintDecisionPayload;
      }) => adminService.decideComplaint(reviewId, payload),
      onSuccess: () => {
        void refresh();
        void qc.invalidateQueries({ queryKey: ["reviews"] });
        void qc.invalidateQueries({ queryKey: ["tutors"] });
      },
    }),
  };
}
