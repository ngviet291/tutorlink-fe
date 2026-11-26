import type { ApplicationResponse } from "../types/application.types";

/**
 * ID của bên phải bấm "Xác nhận" sau khi trả phí.
 * Đồng bộ với ApplicationServiceImpl.confirmApplication:
 * FIND_TUTOR -> người apply là tutor; FIND_STUDENT -> người apply là student.
 */
export function applicantIdOf(a: ApplicationResponse): string | undefined {
  return a.post.type === "FIND_TUTOR" ? a.tutor?.id : a.student?.id;
}

/** User hiện tại có phải người apply (bên xác nhận) của đơn này không. */
export function isApplicant(
  a: ApplicationResponse,
  userId: string | undefined,
): boolean {
  return Boolean(userId) && applicantIdOf(a) === userId;
}

/**
 * Phí nhận lớp luôn do phía tutor trả (BE payCommission chỉ cho TUTOR,
 * resolve theo application.tutor). Dùng để gate nút "Thanh toán phí".
 */
export function isFeePayer(
  a: ApplicationResponse,
  userId: string | undefined,
): boolean {
  return Boolean(userId) && a.tutor?.id === userId;
}
/** Tôi (học viên hoặc gia sư của đơn) đã bấm hoàn thành chưa. */
export function iHaveFinished(
  a: ApplicationResponse,
  userId?: string,
): boolean {
  if (!userId) return false;
  if (a.student?.id === userId) return Boolean(a.studentFinishedAt);
  if (a.tutor?.id === userId) return Boolean(a.tutorFinishedAt);
  return false;
}
