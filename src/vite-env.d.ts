/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_URL?: string;
  readonly VITE_CHATBOT_API_URL?: string;
  readonly VITE_CHATBOT_API_KEY?: string;
  // Giả lập callback VietQR (chỉ dev)
  readonly VITE_VIETQR_SIMULATE?: string;
  readonly VITE_VIETQR_CALLBACK_USERNAME?: string;
  readonly VITE_VIETQR_CALLBACK_PASSWORD?: string;
  //Tracking user
  readonly VITE_TRACKING_ENABLED?: string;
  readonly VITE_TRACKING_FLUSH_SECONDS?: string;
  readonly VITE_GA_ID?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
