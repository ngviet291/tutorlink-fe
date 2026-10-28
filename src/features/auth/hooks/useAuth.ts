import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { authService } from '../service/auth.service'
import { clearAuth, setCredentials } from '../store/authSlice'
import { useAppDispatch } from '@/shared/hooks/useAppStore'
import { ROUTES } from '@/constants/routes'
import type { LoginPayload, RegisterPayload } from '../types/auth.types'

interface LocationState {
  from?: string
}

export function useLogin() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: LoginPayload) => authService.login(p),
    onSuccess: (res) => {
      qc.clear()
      dispatch(setCredentials(res))
      const from = (location.state as LocationState | null)?.from
      navigate(from ?? (res.user.role === 'ADMIN' ? ROUTES.ADMIN : ROUTES.DASHBOARD), { replace: true })
    },
  })
}

export function useRegister(role: 'STUDENT' | 'TUTOR') {
  const dispatch = useAppDispatch()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: RegisterPayload) => (role === 'TUTOR' ? authService.registerTutor(p) : authService.registerStudent(p)),
    onSuccess: (res) => {
      qc.clear()
      dispatch(setCredentials(res))
    },
  })
}

export function useLogout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const qc = useQueryClient()
  return useCallback(() => {
    void authService.logout().catch(() => undefined)
    dispatch(clearAuth())
    qc.clear()
    navigate(ROUTES.HOME, { replace: true })
  }, [dispatch, navigate, qc])
}
