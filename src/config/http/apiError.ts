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
    const status = error.response?.status;
    const data = error.response?.data;

    console.log("HTTP STATUS:", status);
    console.log("HTTP RESPONSE:", data);
    console.log("HTTP URL:", error.config?.url);
    console.log("HTTP METHOD:", error.config?.method);

    const rawFieldErrors = data?.errors;

    const fieldErrors =
      rawFieldErrors && typeof rawFieldErrors === "object"
        ? Object.fromEntries(
            Object.entries(rawFieldErrors as Record<string, unknown>).map(
              ([key, value]) => [key, String(value)],
            ),
          )
        : undefined;

    const fieldErrorText = fieldErrors
      ? Object.entries(fieldErrors)
          .map(([key, value]) => `${key}: ${value}`)
          .join("; ")
      : "";

    const message = fieldErrorText
      ? `${data?.message ?? "Validation failed"} (${fieldErrorText})`
      : (data?.message ??
        data?.detail ??
        data?.error ??
        error.message ??
        "Unknown API error");

    return new ApiError(message, status, fieldErrors);
  }

  return new ApiError(error instanceof Error ? error.message : "Unknown error");
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const details = error.fieldErrors ? Object.values(error.fieldErrors) : [];

    if (details.length > 0) {
      return details.join("\n");
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Đã xảy ra lỗi. Vui lòng thử lại.";
}
