import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError, localizeFieldErrors } from "@/config/http/apiError";
import { getErrorMessage } from "@/shared/utils/errors";

/**
 * Gắn lỗi field từ BE vào đúng input.
 * - Field có trong `knownFields` (sau khi qua `aliases`) -> setError tại input đó.
 * - Field lạ (vd "createPostRequest") -> gom vào `root.server`, KHÔNG setError lên
 *   field không đăng ký, vì lỗi đó không bao giờ được xóa và sẽ chặn submit lần sau.
 * Trả về true nếu có ít nhất một lỗi gắn vào input hoặc root.
 */
export function applyFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  fieldErrors: Record<string, string> | undefined,
  knownFields: readonly string[],
  aliases: Record<string, string> = {},
): boolean {
  if (!fieldErrors) return false;
  const rootMessages: string[] = [];
  let applied = false;
  for (const [name, message] of Object.entries(fieldErrors)) {
    const target = aliases[name] ?? name;
    if (knownFields.includes(target)) {
      setError(target as Path<T>, { type: "server", message });
    } else {
      rootMessages.push(message);
    }
    applied = true;
  }
  if (rootMessages.length > 0) {
    setError("root.server" as Path<T>, {
      type: "server",
      message: rootMessages.join("\n"),
    });
  }
  return applied;
}

/** Lỗi từ mutation: ưu tiên lỗi theo field, không có thì hiện message chung ở root.server. */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  knownFields: readonly string[],
  aliases: Record<string, string> = {},
): void {
  const fieldErrors =
    error instanceof ApiError
      ? (localizeFieldErrors(error.rawFieldErrors) ?? error.fieldErrors)
      : undefined;
  if (applyFieldErrors(setError, fieldErrors, knownFields, aliases)) return;
  setError("root.server" as Path<T>, {
    type: "server",
    message: getErrorMessage(error),
  });
}
