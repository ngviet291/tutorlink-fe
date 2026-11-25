import { useCallback, useMemo } from "react";
import { pushToast, type ToastKind } from "@/shared/store/toastSlice";
import { useAppDispatch } from "./useAppStore";
import { ApiError, getErrorMessage } from "@/config/http/apiError";

export function useToast() {
  const dispatch = useAppDispatch();
  const show = useCallback(
    (kind: ToastKind, message: string) => {
      dispatch(
        pushToast({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          kind,
          message,
        }),
      );
    },
    [dispatch],
  );
  return useMemo(
    () => ({
      success: (m: string) => show("success", m),
      error: (m: string) => show("error", m),
      info: (m: string) => show("info", m),
      warning: (m: string) => show("warning", m),
      apiError: (err: unknown) =>
        dispatch(
          pushToast({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            kind: "error",
            message: getErrorMessage(err),
            apiError: {
              rawMessage: (err as ApiError)?.rawMessage,
              status: (err as ApiError)?.status,
            },
          }),
        ),
      successKey: (key: string, params?: Record<string, unknown>) =>
        dispatch(
          pushToast({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            kind: "success",
            message: "",
            i18nKey: key,
            i18nParams: params,
          }),
        ),
    }),
    [show],
  );
}
