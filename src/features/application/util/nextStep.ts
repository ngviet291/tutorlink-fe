import type { ApplicationResponse } from "../types/application.types";
import { isApplicant, isFeePayer } from "./applicant";

export interface NextStep {
  /** true = chính người đang xem phải làm bước này. */
  mine: boolean;
  /** Câu mô tả bước tiếp theo, đã đúng ngôi (Bạn… / Chờ …). */
  label: string;
  /** true = còn bước đang chờ ai đó; false = đơn đã kết thúc (từ chối, hủy, hoàn thành). */
  pending: boolean;
}

/**
 * Hàm dùng chung: "bước tiếp theo của đơn này là gì, ai phải làm?".
 * Chỉ dựa vào trạng thái BE đã trả (status, paid) — không tự đặt trạng thái mới.
 * Quy tắc khớp BE: gia sư luôn là người trả phí; người ứng tuyển là bên xác nhận;
 * chủ bài là bên chọn/từ chối ứng viên.
 */
export function getNextStep(
  a: ApplicationResponse,
  userId: string | undefined,
): NextStep {
  const isOwner = Boolean(userId) && a.post?.author?.id === userId;
  const payer = isFeePayer(a, userId);
  const applicant = isApplicant(a, userId);
  const paid = Boolean(a.paid);

  switch (a.applicationStatus) {
    case "PENDING":
      return isOwner
        ? {
            mine: true,
            pending: true,
            label: "Bạn cần chọn hoặc từ chối ứng viên này",
          }
        : { mine: false, pending: true, label: "Chờ chủ bài chọn ứng viên" };

    case "ACCEPTED":
      if (!paid) {
        return payer
          ? {
              mine: true,
              pending: true,
              label: "Bạn cần thanh toán phí nhận lớp",
            }
          : {
              mine: false,
              pending: true,
              label: "Chờ gia sư thanh toán phí nhận lớp",
            };
      }
      return applicant
        ? { mine: true, pending: true, label: "Bạn cần xác nhận lớp học" }
        : {
            mine: false,
            pending: true,
            label: "Chờ bên ứng tuyển xác nhận lớp học",
          };

    case "CONFIRMED":
      return {
        mine: Boolean(userId),
        pending: true,
        label: "Lớp đang diễn ra — đánh dấu hoàn thành khi lớp kết thúc",
      };

    case "FINISHED":
      return { mine: false, pending: false, label: "Lớp đã hoàn thành" };
    case "REJECTED":
      return { mine: false, pending: false, label: "Đơn đã bị từ chối" };
    case "CANCELLED":
      return { mine: false, pending: false, label: "Đơn đã bị hủy" };
    default:
      return { mine: false, pending: false, label: "" };
  }
}

/**
 * Việc người dùng PHẢI làm ngay (khác với "đang diễn ra"): chỉ gồm trả phí, xác nhận, chọn ứng viên.
 * CONFIRMED không tính vì không có hạn bắt buộc.
 */
export function needsMyAction(
  a: ApplicationResponse,
  userId: string | undefined,
): boolean {
  const step = getNextStep(a, userId);
  return step.mine && step.pending && a.applicationStatus !== "CONFIRMED";
}
