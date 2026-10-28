import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type ToastKind = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  kind: ToastKind
  message: string
}

const toastSlice = createSlice({
  name: 'toast',
  initialState: { items: [] as ToastItem[] },
  reducers: {
    pushToast(state, action: PayloadAction<ToastItem>) {
      state.items.push(action.payload)
    },
    removeToast(state, action: PayloadAction<string>) {
      state.items = state.items.filter((t) => t.id !== action.payload)
    },
  },
})

export const { pushToast, removeToast } = toastSlice.actions
export default toastSlice.reducer
