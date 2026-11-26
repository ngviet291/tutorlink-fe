import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import { ACCOUNT_STATUS_META } from "@/constants/enums";
import { Avatar } from "@/shared/components/ui/Avatar";
import { Badge } from "@/shared/components/ui/Badge";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { Select } from "@/shared/components/ui/Select";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useInfiniteScroll } from "@/shared/hooks/useInfiniteScroll";
import { useToast } from "@/shared/hooks/useToast";
import { formatDate } from "@/shared/utils/date";
import {
  useAdminMutations,
  useAdminUser,
  useAdminUsers,
} from "@/features/admin/hooks/useAdmin";
import type { AccountStatus, Role } from "@/shared/types/common.types";
import type { BaseUserResponse } from "@/features/user/types/user.types";

const ROLES: Role[] = ["STUDENT", "TUTOR", "ADMIN"];

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const roleLabel = (r: Role) => t(`adminUsers.role.${r}`);
  const toast = useToast();
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [status, setStatus] = useState<AccountStatus | "">("");
  const debounced = useDebounce(keyword);
  const {
    data,
    isLoading,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useAdminUsers({
    role: role || undefined,
    status: status || undefined,
  });
  const loadMoreRef = useInfiniteScroll(
    () => {
      if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
    },
    Boolean(hasNextPage) && !isFetchingNextPage,
  );
  const { setUserStatus } = useAdminMutations();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [selected, setSelected] = useState<BaseUserResponse | null>(null);
  // GET /v1/users/{id}: lấy dữ liệu mới nhất; trong lúc tải dùng tạm dòng của bảng
  const detailQuery = useAdminUser(detailId ?? undefined);
  const detail = detailQuery.data ?? selected;

  // BE chưa có tham số tìm kiếm → lọc theo từ khoá trên các dòng đã tải
  const k = debounced.trim().toLowerCase();
  const items = (data?.pages.flatMap((p) => p.content) ?? []).filter(
    (u) =>
      !k || `${u.fullName} ${u.email} ${u.phone}`.toLowerCase().includes(k),
  );

  const openDetail = (u: BaseUserResponse) => {
    setSelected(u);
    setDetailId(u.id);
  };
  const closeDetail = () => {
    setDetailId(null);
    setSelected(null);
  };

  const change = (u: BaseUserResponse, next: AccountStatus) =>
    setUserStatus.mutate(
      { id: u.id, status: next },
      {
        onSuccess: () => {
          toast.success(t("adminUsers.statusUpdated"));
          void detailQuery.refetch();
        },
        onError: (e) => toast.apiError(e),
      },
    );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <PageHeader title={t("adminUsers.title")} />
      <Input
        aria-label={t("adminUsers.searchAria")}
        placeholder={t("adminUsers.searchPlaceholder")}
        leftIcon={<Search className="size-4" />}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          aria-label={t("adminUsers.filterRoleAria")}
          value={role}
          onChange={(e) => setRole(e.target.value as Role | "")}
          placeholder={t("adminUsers.allRoles")}
          options={ROLES.map((r) => ({
            value: r,
            label: roleLabel(r),
          }))}
        />
        <Select
          aria-label={t("adminUsers.filterStatusAria")}
          value={status}
          onChange={(e) => setStatus(e.target.value as AccountStatus | "")}
          placeholder={t("adminUsers.allStatuses")}
          options={(Object.keys(ACCOUNT_STATUS_META) as AccountStatus[]).map(
            (st) => ({ value: st, label: ACCOUNT_STATUS_META[st].label }),
          )}
        />
      </div>

      {isLoading ? (
        <ListSkeleton />
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : !items.length ? (
        <EmptyState title={t("adminUsers.empty")} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-surface-hover text-xs uppercase text-text-secondary">
                <tr>
                  <th className="p-3">{t("adminUsers.colUser")}</th>
                  <th>{t("adminUsers.colRole")}</th>
                  <th>{t("adminUsers.colStatus")}</th>
                  <th className="pr-3 text-right">
                    {t("adminUsers.colActions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((u) => (
                  <tr key={u.id}>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={u.fullName} size="sm" />
                        <div>
                          <p className="font-semibold text-text">
                            {u.fullName}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge tone="gray">{roleLabel(u.role)}</Badge>
                    </td>
                    <td>
                      <StatusBadge kind="user" status={u.userStatus} />
                    </td>
                    <td className="pr-3 text-right">
                      <button
                        type="button"
                        className="cursor-pointer text-sm font-semibold text-primary hover:underline"
                        onClick={() => openDetail(u)}>
                        {t("adminUsers.details")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasNextPage && (
            <div ref={loadMoreRef} className="h-8" aria-hidden="true" />
          )}
        </>
      )}

      <Modal
        open={Boolean(detail)}
        onClose={closeDetail}
        title={t("adminUsers.detailTitle")}>
        {detail && (
          <div className="flex flex-col gap-4 text-sm">
            {detail.avatarUrl && (
              <div className="flex justify-center">
                <Avatar name={detail.fullName} src={detail.avatarUrl} size="lg" />
              </div>
            )}
            <dl className="grid gap-2 sm:grid-cols-2">
              {[
                [t("adminUsers.id"), detail.id],
                [t("adminUsers.fullName"), detail.fullName],
                [t("adminUsers.email"), detail.email],
                [t("adminUsers.phone"), detail.phone],
                [t("adminUsers.colRole"), roleLabel(detail.role)],
                [
                  t("adminUsers.gender"),
                  detail.gender
                    ? t(`adminUsers.genderValue.${detail.gender}`)
                    : "—",
                ],
                [t("adminUsers.dateOfBirth"), formatDate(detail.dateOfBirth)],
                [
                  t("adminUsers.colStatus"),
                  t(`admin.userStatus.${detail.userStatus}`),
                ],
                [t("adminUsers.street"), detail.address?.street ?? "—"],
                [t("adminUsers.ward"), detail.address?.ward ?? "—"],
                [t("adminUsers.province"), detail.address?.province ?? "—"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-text-secondary">{k}</dt>
                  <dd className="font-semibold text-text">{v}</dd>
                </div>
              ))}
            </dl>
            {detail.role !== "ADMIN" && (
              <Select
                label={t("adminUsers.accountStatus")}
                value={detail.userStatus}
                disabled={setUserStatus.isPending}
                onChange={(e) =>
                  change(detail, e.target.value as AccountStatus)
                }
                options={(
                  Object.keys(ACCOUNT_STATUS_META) as AccountStatus[]
                ).map((s) => ({
                  value: s,
                  label: ACCOUNT_STATUS_META[s].label,
                }))}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
