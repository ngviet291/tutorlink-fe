import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/features/auth/store/authSlice'
import chatUiReducer from '@/features/chat/store/chatUiSlice'
import toastReducer from '@/shared/store/toastSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    toast: toastReducer,
    chatUi: chatUiReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
