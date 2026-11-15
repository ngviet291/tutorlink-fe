import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useAppSelector } from "@/shared/hooks/useAppStore";

export function GuestGuard() {
  const user = useAppSelector((s) => s.auth.user);
  if (user) {
    return (
      <Navigate
        to={user.role === "ADMIN" ? ROUTES.ADMIN : ROUTES.HOME}
        replace
      />
    );
  }
  return <Outlet />;
}
