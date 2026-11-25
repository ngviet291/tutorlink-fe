import { useCallback, useEffect, useRef } from "react";
import type {
  FieldErrors,
  FieldValues,
  Path,
  UseFormReturn,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { ApiError, localizeFieldErrors } from "@/config/http/apiError";
import { applyFieldErrors, applyServerErrors } from "@/shared/utils/formErrors";

type Flat = Array<[string, { type?: string }]>;

function flatten(errors: FieldErrors<FieldValues>, prefix = ""): Flat {
  return Object.entries(errors).flatMap(([key, value]) => {
    const name = prefix ? `${prefix}.${key}` : key;
    if (!value || typeof value !== "object") return [];
    if ("type" in value || "message" in value) {
      return [[name, value as { type?: string }]];
    }
    return flatten(value as FieldErrors<FieldValues>, name);
  });
}

/**
 * source: ApiError (từ mutation) hoặc Record<tên field, message> (trang trả về fieldErrors).
 * Component dùng hook này phải đọc formState.errors lúc render (4 form dưới đều đã đọc).
 */
export function useServerFormErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  known: readonly string[],
  aliases: Record<string, string> = {},
) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const lastSource = useRef<unknown>(null);

  const render = useCallback(
    (source: unknown) => {
      if (source instanceof ApiError) {
        applyServerErrors(source, form.setError, known, aliases);
      } else if (source && typeof source === "object") {
        applyFieldErrors(
          form.setError,
          localizeFieldErrors(source as Record<string, string>),
          known,
          aliases,
        );
      }
    },
    [form.setError, known, aliases],
  );

  const apply = useCallback(
    (source: unknown) => {
      lastSource.current = source;
      render(source);
    },
    [render],
  );

  // Chạy SAU khi component render lại với ngôn ngữ mới,
  // nên rule của register() đã mang chữ mới trước khi trigger().
  useEffect(() => {
    const flat = flatten(form.formState.errors as FieldErrors<FieldValues>);
    if (flat.length === 0) return;
    if (flat.some(([, e]) => e.type === "server") && lastSource.current) {
      render(lastSource.current); // lỗi từ BE: dịch lại từ bản gốc
    }
    const clientNames = flat
      .filter(([, e]) => e.type !== "server")
      .map(([name]) => name);
    if (clientNames.length > 0) {
      void form.trigger(clientNames as Path<T>[], { shouldFocus: false }); // lỗi FE: validate lại
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  return apply;
}
