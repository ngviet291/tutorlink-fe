import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { clearUser, updateUser } from "@/features/auth/store/authSlice";
import type { RootState } from "@/app/store";
import type { TutorResponse } from "../types/tutor.types";

interface TutorProfileState {
  /** Hồ sơ gia sư của người đang đăng nhập (GET /v1/users/me). null nếu không phải TUTOR hoặc chưa tải được. */
  profile: TutorResponse | null;
}

const initialState: TutorProfileState = {
  profile: null,
};

const tutorProfileSlice = createSlice({
  name: "tutorProfile",
  initialState,
  reducers: {
    setTutorProfile(state, action: PayloadAction<TutorResponse | null>) {
      state.profile = action.payload;
    },
    clearTutorProfile(state) {
      state.profile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Đăng xuất / phiên hết hạn / đổi mật khẩu đều qua clearUser → xoá luôn hồ sơ gia sư
      .addCase(clearUser, (state) => {
        state.profile = null;
      })
      // Đổi tên / địa chỉ / avatar ở trang tài khoản → giữ hồ sơ gia sư khớp với auth.user
      .addCase(updateUser, (state, action) => {
        if (!state.profile) return;
        const { fullName, address, avatarUrl } = action.payload;
        if (fullName !== undefined) state.profile.fullName = fullName;
        if (address !== undefined) state.profile.address = address;
        if (avatarUrl !== undefined) state.profile.avatarUrl = avatarUrl;
      });
  },
});

export const { setTutorProfile, clearTutorProfile } = tutorProfileSlice.actions;
export const selectTutorProfile = (state: RootState) =>
  state.tutorProfile.profile;
export default tutorProfileSlice.reducer;
