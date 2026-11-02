import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppDispatch } from '@/shared/hooks/useAppStore'
import { authService } from '../service/auth.service'
import { setUser, clearUser } from '../store/authSlice'
import { tokenStorage } from '../store/tokenStorage'
import type { LoginPayload, RegisterPayload } from '../types/auth.types'

export function useAuthMutations() {
  const dispatch = useAppDispatch()
  const qc = useQueryClient()

  return {
    login: useMutation({
      mutationFn: (payload: LoginPayload) => authService.login(payload),
      onSuccess: (data) => {
        tokenStorage.setTokens(data.accessToken, data.refreshToken)
        dispatch(setUser(data.user))
        qc.clear()
      },
    }),

    register: useMutation({
      mutationFn: (payload: RegisterPayload & { role?: 'STUDENT' | 'TUTOR' }) => {
        const { role, ...rest } = payload
        return role === 'TUTOR'
          ? authService.registerTutor(rest)
          : authService.registerStudent(rest)
      },
      onSuccess: (data) => {
        tokenStorage.setTokens(data.accessToken, data.refreshToken)
        dispatch(setUser(data.user))
        qc.clear()
      },
    }),

    logout: useMutation({
      mutationFn: () => authService.logout(),
      onSettled: () => {
        tokenStorage.clearTokens()
        dispatch(clearUser())
        qc.clear()
      },
    }),
  }
}

// Named convenience exports for individual hooks
export function useLogin() {
  const { login } = useAuthMutations()
  return login
}

export function useRegister(role?: 'STUDENT' | 'TUTOR') {
  const dispatch = useAppDispatch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: RegisterPayload & { role?: 'STUDENT' | 'TUTOR' }) => {
      const { role: r, ...rest } = payload
      const resolvedRole = r ?? role
      return resolvedRole === 'TUTOR'
        ? authService.registerTutor(rest)
        : authService.registerStudent(rest)
    },
    onSuccess: (data) => {
      tokenStorage.setTokens(data.accessToken, data.refreshToken)
      dispatch(setUser(data.user))
      qc.clear()
    },
  })
}

export function useLogout() {
  const dispatch = useAppDispatch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      tokenStorage.clearTokens()
      dispatch(clearUser())
      qc.clear()
    },
  })
}
