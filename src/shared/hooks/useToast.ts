import { useCallback, useMemo } from 'react'
import { pushToast, type ToastKind } from '@/shared/store/toastSlice'
import { useAppDispatch } from './useAppStore'

export function useToast() {
  const dispatch = useAppDispatch()
  const show = useCallback(
    (kind: ToastKind, message: string) => {
      dispatch(pushToast({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, kind, message }))
    },
    [dispatch],
  )
  return useMemo(
    () => ({
      success: (m: string) => show('success', m),
      error: (m: string) => show('error', m),
      info: (m: string) => show('info', m),
      warning: (m: string) => show('warning', m),
    }),
    [show],
  )
}
