import type { PostType } from "@/shared/types/common.types";

/** Nhãn khi người ứng tuyển là gia sư (bài FIND_TUTOR). */
const TUTOR_APPLICANT_LABEL: Record<string, string> = {
  SUBJECT_MISMATCH: "Gia sư không dạy môn học của bài đăng",
  LEVEL_MISMATCH: "Gia sư chưa dạy cấp học này",
  MODE_MISMATCH: "Hình thức dạy (online/offline) không khớp",
  AREA_MISMATCH: "Khu vực dạy không phù hợp",
  AVAILABILITY_MISMATCH: "Lịch rảnh không khớp lịch học của bài đăng",
};

/** Nhãn khi người ứng tuyển là học viên (bài FIND_STUDENT). */
const STUDENT_APPLICANT_LABEL: Record<string, string> = {
  SUBJECT_MISMATCH: "Môn học của học viên không khớp với bài",
  LEVEL_MISMATCH: "Cấp lớp của học viên không khớp với bài",
  MODE_MISMATCH: "Hình thức học (online/offline) không khớp",
  AREA_MISMATCH: "Nhà học viên ở xa nơi học",
  AVAILABILITY_MISMATCH: "Lịch rảnh của học viên không khớp lịch của bài",
};

/** Cảnh báo độ phù hợp do BE trả về (enum MatchWarning), nhãn chọn theo loại bài. */
export function describeWarning(code: string, postType?: PostType): string {
  const labels =
    postType === "FIND_STUDENT"
      ? STUDENT_APPLICANT_LABEL
      : TUTOR_APPLICANT_LABEL;
  return labels[code] ?? code;
}

/** Nối các cảnh báo thành một dòng; không có cảnh báo thì trả undefined. */
export function describeWarnings(
  codes: readonly string[] | undefined,
  postType?: PostType,
): string | undefined {
  if (!codes?.length) return undefined;
  return codes.map((c) => describeWarning(c, postType)).join(" · ");
}
