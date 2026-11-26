import { tutorService } from "@/config/di/container";
import type { AuthUser } from "@/features/user/types/user.types";
import type { TutorResponse } from "../types/tutor.types";

/**
 * Tải hồ sơ gia sư (GET /v1/users/me) để lưu vào Redux ngay sau khi có phiên
 * (login / đăng ký / F5). Chỉ gọi với tài khoản TUTOR.
 *
 * Lỗi được nuốt và trả về null: không tải được hồ sơ không được làm hỏng đăng nhập
 * hay xoá token — các trang vẫn tự tải lại qua `useMyTutorProfile`.
 */
export async function loadTutorProfile(
  user: AuthUser,
): Promise<TutorResponse | null> {
  if (user.role !== "TUTOR") return null;
  try {
    return await tutorService.getMyProfile();
  } catch {
    return null;
  }
}
