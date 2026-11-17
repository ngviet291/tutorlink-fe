import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService, authService } from "@/config/di/container";
import { clearUser, updateUser } from "@/features/auth/store/authSlice";
import { useAppDispatch } from "@/shared/hooks/useAppStore";
import type {
  ChangePasswordPayload,
  UpdateProfilePayload,
} from "../types/user.types";

export function useUpdateProfile() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (p: UpdateProfilePayload) => userService.updateProfile(p),
    onSuccess: (user) =>
      dispatch(
        updateUser({
          fullName: user.fullName,
          phone: user.phone,
          address: user.address,
        }),
      ),
  });
}

export function useUploadAvatar() {
  const dispatch = useAppDispatch();
  return useMutation({
    mutationFn: (file: File) => userService.uploadAvatar(file),
    onSuccess: (user) => dispatch(updateUser({ avatarUrl: user.avatarUrl })),
  });
}

export function useChangePassword() {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: ChangePasswordPayload) => userService.changePassword(p),
    onSuccess: async () => {
      try {
        await authService.logout();
      } catch {}
      dispatch(clearUser());
      qc.clear();
    },
  });
}
