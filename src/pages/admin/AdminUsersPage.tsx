import { useState } from "react";
import { Search } from "lucide-react";
import { ACCOUNT_STATUS_META } from "@/constants/enums";
import { Avatar } from "@/shared/components/ui/Avatar";
import { Badge } from "@/shared/components/ui/Badge";
import { EmptyState, ErrorState } from "@/shared/components/ui/EmptyState";
import { Input } from "@/shared/components/ui/Input";
import { Modal } from "@/shared/components/ui/Modal";
import { PageHeader } from "@/shared/components/ui/PageHeader";
import { Button } from "@/shared/components/ui/Button";
import { ListSkeleton } from "@/shared/components/ui/Skeleton";
import { Select } from "@/shared/components/ui/Select";
import { StatusBadge } from "@/shared/components/ui/StatusBadge";
import { getErrorMessage } from "@/shared/utils/errors";
import { useDebounce } from "@/shared/hooks/useDebounce";
import { useToast } from "@/shared/hooks/useToast";
import {
  useAdminMutations,
  useAdminUser,
  useAdminUsers,
} from "@/features/admin/hooks/useAdmin";
import type { AccountStatus, Role } from "@/shared/types/common.types";
import type { BaseUserResponse } from "@/features/user/types/user.types";

const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Học viên",
  TUTOR: "Gia sư",
  ADMIN: "Admin",
};

export default function AdminUsersPage() {
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
          toast.success("Đã cập nhật trạng thái tài khoản");
          void detailQuery.refetch();
        },
        onError: (e) => toast.error(getErrorMessage(e)),
      },
    );

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <PageHeader title="Quản lý người dùng" />
      <Input
        aria-label="Tìm người dùng"
        placeholder="Tìm theo tên, email, SĐT..."
        leftIcon={<Search className="size-4" />}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          aria-label="Lọc theo vai trò"
          value={role}
          onChange={(e) => setRole(e.target.value as Role | "")}
          placeholder="Tất cả vai trò"
          options={(Object.keys(ROLE_LABEL) as Role[]).map((r) => ({
            value: r,
            label: ROLE_LABEL[r],
          }))}
        />
        <Select
          aria-label="Lọc theo trạng thái"
          value={status}
          onChange={(e) => setStatus(e.target.value as AccountStatus | "")}
          placeholder="Tất cả trạng thái"
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
        <EmptyState title="Không có người dùng" />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-surface-hover text-xs uppercase text-text-secondary">
                <tr>
                  <th className="p-3">Người dùng</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th className="pr-3 text-right">Thao tác</th>
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
                      <Badge tone="gray">{ROLE_LABEL[u.role]}</Badge>
                    </td>
                    <td>
                      <StatusBadge kind="user" status={u.userStatus} />
                    </td>
                    <td className="pr-3 text-right">
                      <button
                        type="button"
                        className="cursor-pointer text-sm font-semibold text-primary hover:underline"
                        onClick={() => openDetail(u)}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                loading={isFetchingNextPage}
                onClick={() => void fetchNextPage()}
              >
                Xem thêm
              </Button>
            </div>
          )}
        </>
      )}

      <Modal
        open={Boolean(detail)}
        onClose={closeDetail}
        title="Chi tiết người dùng"
      >
        {detail && (
          <div className="flex flex-col gap-4 text-sm">
            <dl className="grid gap-2 sm:grid-cols-2">
              {[
                ["Họ tên", detail.fullName],
                ["Email", detail.email],
                ["SĐT", detail.phone],
                ["Vai trò", ROLE_LABEL[detail.role]],
                [
                  "Khu vực",
                  [detail.address?.ward, detail.address?.province]
                    .filter(Boolean)
                    .join(", ") || "—",
                ],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-text-secondary">{k}</dt>
                  <dd className="font-semibold text-text">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-text-secondary">
              Mật khẩu không bao giờ được hiển thị.
            </p>
            {detail.role !== "ADMIN" && (
              <Select
                label="Trạng thái tài khoản"
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
