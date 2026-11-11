const flag = import.meta.env.VITE_USE_MOCK as string | undefined;

export const env = {
  useMock: flag !== undefined ? flag === "true" : import.meta.env.DEV,

  features: {
    auth: false,
    user: false, 
    tutor: false, 
    tutorProfile: false, 
    subject: false,
    student: true,
    notify: true,
    booking: true,
    chatbot: true,
    admin: true, // posts/transactions/fee/stats/complaints — chưa nối
    adminUser: false,
    application: true,
    chat: true,
    favorite: false, 
    post: false,
    review: true,
    wallet: true,

    tracking: false, // false = Gọi API thật
  },

  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,

  chatbotApiUrl: import.meta.env.VITE_CHATBOT_API_URL ?? "",
  chatbotApiKey: import.meta.env.VITE_CHATBOT_API_KEY ?? "",
  provinceOpenUrl: import.meta.env.PROVINCE_OPEN_URL ?? "",
};

export const mockConfig = {
  application: env.features.application,
  admin: env.features.admin,
  adminUser: env.features.adminUser,
  subject: env.features.subject,
  auth: env.features.auth,
  user: env.features.user,
  tutor: env.features.tutor,
  tutorProfile: env.features.tutorProfile,
  notify: env.features.notify,
  student: env.features.student,
  booking: env.features.booking,
  chatbot: env.features.chatbot,
  chat: env.features.chat,
  favorite: env.features.favorite,
  post: env.features.post,
  review: env.features.review,
  wallet: env.features.wallet,
  tracking: env.features.tracking,
};
