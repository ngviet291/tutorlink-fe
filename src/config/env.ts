import { subjects } from "@/mocks/db";

const flag = import.meta.env.VITE_USE_MOCK as string | undefined;

export const env = {
  useMock: flag !== undefined ? flag === "true" : import.meta.env.DEV,

  features: {
    auth: false, // false = API thật
    user: true, // true = Mock
    tutor: true,
    subject: false,
    student: true,
    notify: true,
    booking: true,
    chatbot: true,
    admin: true,
    application: true,
    chat: true,
    favorite: true,
    post: false,
    review: true,
    wallet: true,
  },

  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,

  chatbotApiUrl: import.meta.env.VITE_CHATBOT_API_URL ?? "",
  chatbotApiKey: import.meta.env.VITE_CHATBOT_API_KEY ?? "",
};

export const mockConfig = {
  application: env.features.application,
  admin: env.features.admin,
  subject: env.features.subject,
  auth: env.features.auth,
  user: env.features.user,
  tutor: env.features.tutor,
  notify: env.features.notify,
  student: env.features.student,
  booking: env.features.booking,
  chatbot: env.features.chatbot,
  chat: env.features.chat,
  favorite: env.features.favorite,
  post: env.features.post,
  review: env.features.review,
  wallet: env.features.wallet,
};
