import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface ChatUiState {
  /** Kênh đang mở trên màn hình (để biết có tính chưa đọc / tự đánh dấu đã đọc hay không). */
  activeChannelId: string | null
}

const chatUiSlice = createSlice({
  name: 'chatUi',
  initialState: { activeChannelId: null } as ChatUiState,
  reducers: {
    setActiveChannel(state, action: PayloadAction<string | null>) {
      state.activeChannelId = action.payload
    },
  },
})

export const { setActiveChannel } = chatUiSlice.actions
export default chatUiSlice.reducer
