import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/shared/hooks/useAppStore";
import type { AuthUser } from "@/features/user/types/user.types";
import { clearUser, setUser } from "../store/authSlice";
import { setTutorProfile } from "@/features/tutor/store/tutorProfileSlice";
import { loadTutorProfile } from "@/features/tutor/store/loadTutorProfile";
import type {
  ForgotPasswordRequest,
  LoginRequest,
  RegisterStudentRequest,
  RegisterTutorRequest,
  ResetPasswordRequest,
  SendVerificationCodeRequest,
} from "../types/auth.dto";
import { authService } from "@/config/di/container";

/**
 * Dùng chung cho mọi thao tác mở phiên (đăng nhập / đăng ký): lưu user vào store,
 * với tài khoản TUTOR thì tải thêm hồ sơ gia sư (GET /v1/users/me) rồi lưu vào store,
 * và xoá cache của phiên cũ. Hồ sơ được tải xong trước khi `setUser` nên khi giao diện
 * chuyển trang thì store đã có đủ dữ liệu.
 */
function useSessionMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<AuthUser>,
) {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const user = await mutationFn(variables);
      const tutorProfile = await loadTutorProfile(user);
      return { user, tutorProfile };
    },
    onSuccess: ({ user, tutorProfile }) => {
      dispatch(setUser(user));
      dispatch(setTutorProfile(tutorProfile));
      qc.clear();
    },
  });
}

export function useLogin() {
  return useSessionMutation((req: LoginRequest) => authService.login(req));
}

export function useRegisterStudent() {
  return useSessionMutation((req: RegisterStudentRequest) =>
    authService.registerStudent(req),
  );
}

export function useRegisterTutor() {
  return useSessionMutation((req: RegisterTutorRequest) =>
    authService.registerTutor(req),
  );
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      dispatch(clearUser());
      qc.clear();
    },
  });
}

/** Gửi mã xác minh email khi đăng ký. */
export function useSendVerificationCode() {
  return useMutation({
    mutationFn: (req: SendVerificationCodeRequest) =>
      authService.sendVerificationCode(req),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (req: ForgotPasswordRequest) => authService.forgotPassword(req),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (req: ResetPasswordRequest) => authService.resetPassword(req),
  });
}

export function useIntrospect() {
  return useMutation({ mutationFn: () => authService.introspect() });
}

type RegisterRequest = RegisterStudentRequest | RegisterTutorRequest;

export function useRegister(role: "STUDENT" | "TUTOR") {
  return useSessionMutation((req: RegisterRequest) =>
    role === "STUDENT"
      ? authService.registerStudent(req as RegisterStudentRequest)
      : authService.registerTutor(req as RegisterTutorRequest),
  );
}
