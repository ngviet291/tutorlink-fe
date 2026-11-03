import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAppDispatch } from "@/shared/hooks/useAppStore";
import { PageSpinner } from "@/shared/components/ui/Spinner";
import { userService } from "@/features/user/service/user.service";
import { setUser, clearUser } from "../store/authSlice";
import { tokenStorage } from "@/config/di/container";

export function AuthInitializer({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const [ready, setReady] = useState(false);
  const initialize = async () => {
    try {
      const token = await tokenStorage.getAccessToken();

      if (token) {
        const user = await userService.getMe();
        dispatch(setUser(user));
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

  if (!ready) return <PageSpinner />;

  return <>{children}</>;
}
