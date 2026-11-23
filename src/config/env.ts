export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,

  /** WebSocket STOMP/SockJS. Mặc định `${apiBaseUrl}/ws` (dùng http/https, không phải ws://). */
  wsUrl:
    import.meta.env.VITE_WS_URL ?? `${import.meta.env.VITE_API_BASE_URL}/ws`,

  chatbotApiUrl: import.meta.env.VITE_CHATBOT_API_URL ?? "",
  chatbotApiKey: import.meta.env.VITE_CHATBOT_API_KEY ?? "",
  provinceOpenUrl: import.meta.env.PROVINCE_OPEN_URL ?? "",
};
