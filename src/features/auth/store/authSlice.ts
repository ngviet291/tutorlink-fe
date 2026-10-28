import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthUser } from '@/features/user/types/user.types'
import { tokenStorage } from './tokenStorage'

interface AuthState {
  user: AuthUser | null
  isAuthenticated: boolean
}

const storedUser = tokenStorage.getUser()

const initialState: AuthState = {
  user: storedUser && tokenStorage.getAccessToken() ? storedUser : null,
  isAuthenticated: Boolean(storedUser && tokenStorage.getAccessToken()),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string; refreshToken: string }>,
    ) {
      state.user = action.payload.user
      state.isAuthenticated = true
      tokenStorage.setTokens(action.payload.accessToken, action.payload.refreshToken)
      tokenStorage.setUser(action.payload.user)
    },
    updateUser(state, action: PayloadAction<Partial<AuthUser>>) {
      if (!state.user) return
      state.user = { ...state.user, ...action.payload }
      tokenStorage.setUser(state.user)
    },
    clearAuth(state) {
      state.user = null
      state.isAuthenticated = false
      tokenStorage.clear()
    },
  },
})

export const { setCredentials, updateUser, clearAuth } = authSlice.actions
export default authSlice.reducer
