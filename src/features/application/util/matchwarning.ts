/** Cảnh báo độ phù hợp do BE trả về (enum MatchWarning), kèm thông báo hiển thị cho từng loại. */
export const MATCH_WARNING_LABEL: Record<string, string> = {
  SUBJECT_MISMATCH: "Gia sư không dạy môn học của bài đăng",
  LEVEL_MISMATCH: "Gia sư chưa dạy cấp học này",
  MODE_MISMATCH: "Hình thức dạy (online/offline) không khớp",
  AREA_MISMATCH: "Khu vực dạy không phù hợp",
  AVAILABILITY_MISMATCH: "Lịch rảnh không khớp lịch học của bài đăng",
};

export function describeWarning(code: string): string {
  return MATCH_WARNING_LABEL[code] ?? code;
}

/** Nối các cảnh báo thành một dòng; không có cảnh báo thì trả undefined. */
export function describeWarnings(
  codes?: readonly string[],
): string | undefined {
  if (!codes?.length) return undefined;
  return codes.map(describeWarning).join(" · ");
}
