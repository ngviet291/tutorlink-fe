import i18n from "@/app/i18n";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** SĐT Việt Nam: 10 số, đầu 03/05/07/08/09. Khớp regex của BE (không nhận +84). */
export const VN_PHONE_RE = /^0[35789]\d{8}$/;

const t = (key: string, opts?: Record<string, unknown>): string =>
  i18n.t(key, opts) as string;

/** Khớp PasswordValidator của BE. Trả true nếu đạt, ngược lại trả message nêu rõ rule còn thiếu. */
export function passwordProblems(pw: string): true | string {
  const missing: string[] = [];
  if (pw.length < 8) missing.push(t("validation.pwMin"));
  if (!/[a-z]/.test(pw)) missing.push(t("validation.pwLower"));
  if (!/[A-Z]/.test(pw)) missing.push(t("validation.pwUpper"));
  if (!/\d/.test(pw)) missing.push(t("validation.pwDigit"));
  if (!/[^a-zA-Z0-9\s]/.test(pw)) missing.push(t("validation.pwSpecial"));
  if (/\s/.test(pw)) missing.push(t("validation.pwNoSpace"));
  return missing.length === 0
    ? true
    : t("validation.passwordMissing", { rules: missing.join(", ") });
}

/**
 * Message lấy theo ngôn ngữ đang chọn tại thời điểm đọc (getter), nên đổi ngôn ngữ
 * thì lần render kế tiếp của form sẽ dùng câu mới.
 */
export const rules = {
  required: () => t("validation.required"),
  get email() {
    return {
      required: t("validation.emailRequired"),
      pattern: { value: EMAIL_RE, message: t("validation.emailInvalid") },
    };
  },
  get password() {
    return {
      required: t("validation.passwordRequired"),
      validate: (v: string) => passwordProblems(v),
    };
  },
  get phone() {
    return {
      required: t("validation.phoneRequired"),
      pattern: { value: VN_PHONE_RE, message: t("validation.phoneInvalid") },
    };
  },
};
