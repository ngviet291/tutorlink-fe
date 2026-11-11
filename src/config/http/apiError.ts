import axios from "axios";

export class ApiError extends Error {
  status?: number | string;
  fieldErrors?: Record<string, string>;

  constructor(
    message: string,
    status?: number | string,
    fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    console.log("HTTP STATUS:", error.response?.status);
    console.log("HTTP RESPONSE:", error.response?.data);
    console.log("HTTP URL:", error.config?.url);
    console.log("HTTP METHOD:", error.config?.method);

    const data = error.response?.data;

    const message =
      data?.message ??
      data?.detail ??
      data?.error ??
      error.message ??
      "Unknown API error";

    const raw = data?.errors;
    const fieldErrors =
      raw && typeof raw === "object"
        ? (raw as Record<string, string>)
        : undefined;

    return new ApiError(message, status, fieldErrors);
  }

  return new ApiError(error instanceof Error ? error.message : "Unknown error");
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const details = error.fieldErrors ? Object.values(error.fieldErrors) : [];
    if (details.length > 0) return details.join("\n");
  }
  if (error instanceof Error) {
    return error.message;
  }

  return "Đã xảy ra lỗi. Vui lòng thử lại.";
}
