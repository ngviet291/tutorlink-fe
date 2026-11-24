import axios from "axios";

export class ApiError extends Error {
  status?: number | string;
  fieldErrors?: Record<string, string>;
  code?: string;
  rawMessage?: string;

  constructor(
    message: string,
    status?: number | string,
    fieldErrors?: Record<string, string>,
    code?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.code = code;
  }
}

export const GENERIC_ERROR_MESSAGE = "Đã xảy ra lỗi. Vui lòng thử lại.";
export const NETWORK_ERROR_MESSAGE =
  "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";

const STATUS_MESSAGES: Record<number, string> = {
  400: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.",
  401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  403: "Bạn không có quyền thực hiện thao tác này.",
  404: "Không tìm thấy dữ liệu yêu cầu.",
  408: "Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.",
  409: "Dữ liệu đã tồn tại hoặc thao tác đang bị xung đột.",
  413: "Tệp tải lên quá lớn. Vui lòng chọn tệp nhỏ hơn.",
  415: "Định dạng tệp không được hỗ trợ.",
  422: "Thông tin không hợp lệ. Vui lòng kiểm tra lại.",
  429: "Bạn đang thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau.",
  500: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
  502: "Hệ thống đang tạm thời không khả dụng. Vui lòng thử lại sau.",
  503: "Hệ thống đang tạm thời không khả dụng. Vui lòng thử lại sau.",
  504: "Hệ thống đang tạm thời không khả dụng. Vui lòng thử lại sau.",
};

export function messageForStatus(status?: number | string): string {
  const code = Number(status);
  if (!Number.isFinite(code)) return GENERIC_ERROR_MESSAGE;
  if (STATUS_MESSAGES[code]) return STATUS_MESSAGES[code];
  if (code >= 500) return STATUS_MESSAGES[500];
  if (code >= 400) return STATUS_MESSAGES[400];
  return GENERIC_ERROR_MESSAGE;
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
export function localizeFieldMessage(message: unknown): string {
  if (isVietnameseMessage(message)) return message.trim();
  const text = typeof message === "string" ? message.toLowerCase() : "";
  if (/blank|required|empty|must not be null|cannot be null/.test(text)) {
    return "Vui lòng nhập thông tin này.";
  }
  if (/email/.test(text)) return "Email không hợp lệ.";
  if (/size|length|too long|too short/.test(text)) {
    return "Độ dài không hợp lệ.";
  }
  if (/min|max|greater|less|positive|range/.test(text)) {
    return "Giá trị không nằm trong phạm vi cho phép.";
  }
  if (/pattern|format|invalid/.test(text)) return "Định dạng không hợp lệ.";
  return "Giá trị không hợp lệ.";
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
  if (error == null) return GENERIC_ERROR_MESSAGE;

  if (typeof error === "object") {
    const e = error as ErrorLike;
    const isApiError =
      error instanceof ApiError || (e.name === "ApiError" && "message" in e);

    if (isApiError) {
      const status = e.status as number | string | undefined;
      if (isVietnameseMessage(e.message)) return e.message.trim();

      if (e.fieldErrors && typeof e.fieldErrors === "object") {
        const vi = Object.values(e.fieldErrors as Record<string, unknown>)
          .filter(isVietnameseMessage)
          .map((m) => m.trim());
        if (vi.length > 0) return vi.join("\n");
      }
      if (status === undefined && isNetworkLike(error)) {
        return NETWORK_ERROR_MESSAGE;
      }
      if (status === undefined) {
        return typeof e.message === "string" &&
          /network|failed to fetch|timeout|timed out/i.test(e.message)
          ? NETWORK_ERROR_MESSAGE
          : GENERIC_ERROR_MESSAGE;
      }
      return messageForStatus(status);
    }
  }

  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: unknown } | undefined;
    if (isVietnameseMessage(data?.message)) return data.message.trim();
    if (!error.response) return NETWORK_ERROR_MESSAGE;
    return messageForStatus(error.response.status);
  }

  if (error instanceof Error) {
    if (isVietnameseMessage(error.message)) return error.message.trim();
    if (isNetworkLike(error)) return NETWORK_ERROR_MESSAGE;
    return GENERIC_ERROR_MESSAGE;
  }

  if (isVietnameseMessage(error)) return (error as string).trim();
  return GENERIC_ERROR_MESSAGE;
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
              ([key, value]) => [key, localizeFieldMessage(value)],
            ),
          )
        : undefined;

    const backendMessage =
      data?.message ?? data?.detail ?? data?.error ?? error.message;
    const code =
      typeof data?.code === "string" ? (data.code as string) : undefined;

    const message = !error.response
      ? NETWORK_ERROR_MESSAGE
      : isVietnameseMessage(backendMessage)
        ? backendMessage.trim()
        : messageForStatus(status);

    const apiError = new ApiError(message, status, fieldErrors, code);
    apiError.rawMessage =
      typeof backendMessage === "string" ? backendMessage : undefined;
    return apiError;
  }

  if (error instanceof ApiError) return error;

  return new ApiError(resolveErrorMessage(error));
}
