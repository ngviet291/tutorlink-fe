import { useMutation } from '@tanstack/react-query'
import { userService } from '../service/user.service'
import { updateUser } from '@/features/auth/store/authSlice'
import { useAppDispatch } from '@/shared/hooks/useAppStore'
import type { ChangePasswordPayload, UpdateProfilePayload } from '../types/user.types'

export function useUpdateProfile() {
  const dispatch = useAppDispatch()
  return useMutation({
    mutationFn: (p: UpdateProfilePayload) => userService.updateProfile(p),
    onSuccess: (user) => dispatch(updateUser({ fullName: user.fullName, phone: user.phone, address: user.address })),
  })
}

export function useChangePassword() {
  return useMutation({ mutationFn: (p: ChangePasswordPayload) => userService.changePassword(p) })
}
