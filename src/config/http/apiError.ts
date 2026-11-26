import axios from "axios";
import i18n from "@/app/i18n";
import { translateBackendMessage } from "@/shared/i18n/backendMessages";

export class ApiError extends Error {
  status?: number | string;
  fieldErrors?: Record<string, string>;
  code?: string;
  rawMessage?: string;
  rawFieldErrors?: Record<string, string>;

  constructor(
    message: string,
    status?: number | string,
    fieldErrors?: Record<string, string>,
    code?: string,
    rawFieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.code = code;
    this.rawFieldErrors = rawFieldErrors;
  }
}

/** Câu lỗi chung theo ngôn ngữ đang chọn (đọc lúc gọi, không cố định lúc tải module). */
export const genericErrorMessage = () => i18n.t("error.unknown");
export const networkErrorMessage = () => i18n.t("error.network");

/** Mã HTTP -> key i18n (`error.s<mã>`); mã không có bảng riêng rơi về nhóm gần nhất. */
const STATUS_KEYS = new Set([
  400, 401, 403, 404, 408, 409, 413, 415, 422, 429, 500, 503,
]);

export function messageForStatus(status?: number | string): string {
  const code = Number(status);
  if (!Number.isFinite(code)) return genericErrorMessage();
  if (code === 502 || code === 504) return i18n.t("error.s503");
  if (STATUS_KEYS.has(code)) return i18n.t(`error.s${code}`);
  if (code >= 500) return i18n.t("error.s500");
  if (code >= 400) return i18n.t("error.s400");
  return genericErrorMessage();
}

const VIETNAMESE_RE =
  /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

const TECHNICAL_RE =
  /network error|request failed|status code|axioserror|validation failed|internal server error|bad request|unauthorized|forbidden|not found|timeout|timed out|failed to fetch|unknown (api )?error|exception|\bnull\b|undefined|\bat [\w.$]+\(/i;

export function isVietnameseMessage(message?: unknown): message is string {
  if (typeof message !== "string") return false;
  const text = message.trim();
  return (
    text.length > 0 && VIETNAMESE_RE.test(text) && !TECHNICAL_RE.test(text)
  );
}
export function localizeFieldMessage(message: unknown, field?: string): string {
  if (field && /password/i.test(field)) {
    return i18n.t("validation.passwordHint");
  }
  const known = translateBackendMessage(message);
  if (known) return known;
  const text = typeof message === "string" ? message.toLowerCase() : "";
  if (/blank|required|empty|must not be null|cannot be null/.test(text)) {
    return i18n.t("validation.fieldRequired");
  }
  if (/email/.test(text)) return i18n.t("validation.fieldEmail");
  if (/size|length|too long|too short/.test(text)) {
    return i18n.t("validation.fieldLength");
  }
  if (/min|max|greater|less|positive|range/.test(text)) {
    return i18n.t("validation.fieldRange");
  }
  if (/pattern|format|invalid/.test(text))
    return i18n.t("validation.fieldFormat");
  return i18n.t("validation.fieldInvalid");
}
export function localizeFieldErrors(
  raw: Record<string, unknown> | undefined,
): Record<string, string> | undefined {
  return raw
    ? Object.fromEntries(
        Object.entries(raw).map(([k, v]) => [k, localizeFieldMessage(v, k)]),
      )
    : undefined;
}
function isNetworkLike(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    if (error.response) return false;
    return true; // ERR_NETWORK, ECONNABORTED, ETIMEDOUT, bị hủy...
  }
  if (error instanceof Error) {
    return /network|failed to fetch|load failed|timeout|timed out/i.test(
      error.message,
    );
  }
  return false;
}

type ErrorLike = {
  name?: unknown;
  message?: unknown;
  status?: unknown;
  code?: unknown;
  fieldErrors?: unknown;
};

export function resolveErrorMessage(error: unknown): string {
  if (error == null) return genericErrorMessage();

  if (typeof error === "object") {
    const e = error as ErrorLike;
    const isApiError =
      error instanceof ApiError || (e.name === "ApiError" && "message" in e);

    if (isApiError) {
      const status = e.status as number | string | undefined;
      const source = (e as { rawMessage?: unknown }).rawMessage ?? e.message;
      const translated = translateBackendMessage(source);
      if (translated) return translated;

      if (e.fieldErrors && typeof e.fieldErrors === "object") {
        const msgs = Object.values(e.fieldErrors as Record<string, unknown>)
          .map(translateBackendMessage)
          .filter((m): m is string => Boolean(m));
        if (msgs.length > 0) return msgs.join("\n");
      }
      if (status === undefined && isNetworkLike(error)) {
        return networkErrorMessage();
      }
      if (status === undefined) {
        return typeof e.message === "string" &&
          /network|failed to fetch|timeout|timed out/i.test(e.message)
          ? networkErrorMessage()
          : genericErrorMessage();
      }
      return messageForStatus(status);
    }
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: unknown } | undefined;
    const translatedData = translateBackendMessage(data?.message);
    if (translatedData) return translatedData;
    if (!error.response) return networkErrorMessage();
    return messageForStatus(error.response.status);
  }

  if (error instanceof Error) {
    const translatedErr = translateBackendMessage(error.message);
    if (translatedErr) return translatedErr;
    if (isNetworkLike(error)) return networkErrorMessage();
    return genericErrorMessage();
  }

  const translatedRaw = translateBackendMessage(error);
  if (translatedRaw) return translatedRaw;
  return genericErrorMessage();
}

export const getErrorMessage = resolveErrorMessage;

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data;

    const rawFieldErrors = data?.errors;

    const fieldErrors =
      rawFieldErrors && typeof rawFieldErrors === "object"
        ? Object.fromEntries(
            Object.entries(rawFieldErrors as Record<string, unknown>).map(
              ([key, value]) => [key, localizeFieldMessage(value, key)],
            ),
          )
        : undefined;

    const backendMessage =
      data?.message ?? data?.detail ?? data?.error ?? error.message;
    const code =
      typeof data?.code === "string" ? (data.code as string) : undefined;

    const message = !error.response
      ? networkErrorMessage()
      : (translateBackendMessage(backendMessage) ?? messageForStatus(status));

    const apiError = new ApiError(message, status, fieldErrors, code);
    apiError.rawFieldErrors =
      rawFieldErrors && typeof rawFieldErrors === "object"
        ? (rawFieldErrors as Record<string, string>)
        : undefined;
    apiError.rawMessage =
      typeof backendMessage === "string" ? backendMessage : undefined;
    return apiError;
  }

  if (error instanceof ApiError) return error;

  return new ApiError(resolveErrorMessage(error));
}
