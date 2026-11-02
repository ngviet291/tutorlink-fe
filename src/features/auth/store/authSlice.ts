import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthUser } from '@/features/user/types/user.types'
import type { Address } from '@/shared/types/common.types'

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload
    },
    clearUser(state) {
      state.user = null
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
    updateUser(state, action: PayloadAction<{ fullName?: string; phone?: string; address?: Address }>) {
      if (state.user) {
        Object.assign(state.user, action.payload)
      }
    },
  },
})

export const { setUser, clearUser, setLoading, updateUser } = authSlice.actions
export default authSlice.reducer
