import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "../service/user.service";
import { clearUser, updateUser } from "@/features/auth/store/authSlice";
import { authService } from "@/config/di/container";
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
