import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAppDispatch } from "@/shared/hooks/useAppStore";
import { PageSpinner } from "@/shared/components/ui/Spinner";
import { userService, tokenStorage } from "@/config/di/container";
import { setUser, clearUser } from "../store/authSlice";
import { setTutorProfile } from "@/features/tutor/store/tutorProfileSlice";
import { loadTutorProfile } from "@/features/tutor/store/loadTutorProfile";
import { unauthorizedEvent } from "@/config/events/emitter";

export function AuthInitializer({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);
  const initialize = async () => {
    try {
      const token = await tokenStorage.getAccessToken();

      if (token) {
        const user = await userService.getMe();
        // F5: Redux mất sạch state nên tải lại hồ sơ gia sư trước khi hiện giao diện
        const tutorProfile = await loadTutorProfile(user);
        dispatch(setUser(user));
        dispatch(setTutorProfile(tutorProfile));
      }
    } catch {
      await tokenStorage.clear();
      dispatch(clearUser());
    } finally {
      setReady(true);
    }
  };
  useEffect(() => {
    initialize();
  }, [dispatch]);

  // Refresh token thất bại / 401: tầng HTTP chỉ phát sự kiện, ở đây xóa user để Redux không giữ phiên cũ
  useEffect(
    () =>
      unauthorizedEvent.on(() => {
        dispatch(clearUser());
      }),
    [dispatch],
  );

  if (!ready) return <PageSpinner />;

  return <>{children}</>;
}
