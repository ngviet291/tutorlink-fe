/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK?: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_CHATBOT_API_URL?: string;
  readonly VITE_CHATBOT_API_KEY?: string;
  //Tracking user
  readonly VITE_TRACKING_ENABLED?: string;
  readonly VITE_TRACKING_FLUSH_SECONDS?: string;
  readonly VITE_GA_ID?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
