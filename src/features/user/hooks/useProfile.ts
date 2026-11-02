import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '../service/user.service'
import type { ChangePasswordPayload, UpdateProfilePayload } from '../types/user.types'

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => userService.updateProfile(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth', 'me'] }),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => userService.changePassword(payload),
  })
}
