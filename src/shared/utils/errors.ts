import i18n from "@/app/i18n";
import { resolveErrorMessage } from "@/config/http/apiError";

const CODE_TO_I18N: Record<string, string> = {
  INVALID_CREDENTIALS: "error.invalidCredentials",
  EMAIL_EXISTS: "error.emailExists",
  ALREADY_APPLIED: "error.alreadyApplied",
  OWN_POST: "error.ownPost",
  TUTOR_NOT_APPROVED: "error.tutorNotApproved",
  INSUFFICIENT_BALANCE: "error.insufficientBalance",
  ACCOUNT_LOCKED: "error.accountLocked",
  AI_UNAVAILABLE: "error.aiUnavailable",
  UNAUTHORIZED: "error.unauthorized",
  FORBIDDEN: "error.forbidden",
  NOT_FOUND: "error.notFound",
  INVALID_SUBJECT: "error.unknown",
  POST_CLOSED: "error.postClosed",
  WRONG_PASSWORD: "error.wrongPassword",
  AUTH_VERIFY_001: "error.verifyCodeInvalid",
  AUTH_VERIFY_002: "error.verifyCodeExpired",
  AUTH_VERIFY_003: "error.verifyTooManyAttempts",
  AUTH_VERIFY_004: "error.verifyResendTooSoon",
};

export function getErrorMessage(error: unknown): string {
  const code =
    error && typeof error === "object" && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;

  if (typeof code === "string" && CODE_TO_I18N[code]) {
    const translated = i18n.t(CODE_TO_I18N[code]);
    if (translated && translated !== CODE_TO_I18N[code]) return translated;
  }
  return resolveErrorMessage(error);
}
