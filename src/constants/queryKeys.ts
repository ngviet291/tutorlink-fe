export const queryKeys = {
  auth: { me: ['auth', 'me'] as const },
  subjects: { all: ['subjects'] as const },
  posts: {
    all: ['posts'] as const,
    list: (params: unknown) => ['posts', 'list', params] as const,
    detail: (id: string) => ['posts', 'detail', id] as const,
    mine: ['posts', 'mine'] as const,
  },
  tutors: {
    all: ['tutors'] as const,
    list: (params: unknown) => ['tutors', 'list', params] as const,
    detail: (id: string) => ['tutors', 'detail', id] as const,
    me: ['tutors', 'me'] as const,
  },
  applications: {
    all: ['applications'] as const,
    mine: ['applications', 'mine'] as const,
    byPost: (postId: string) => ['applications', 'byPost', postId] as const,
    aiTop5: (postId: string) => ['applications', 'ai', postId] as const,
  },
  wallet: {
    balance: ['wallet', 'balance'] as const,
    transactions: (params: unknown) => ['wallet', 'transactions', params] as const,
    quote: (applicationId: string) => ['wallet', 'quote', applicationId] as const,
  },
  chat: {
    room: (applicationId: string) => ['chat', 'room', applicationId] as const,
  },
  reviews: {
    byTutor: (tutorId: string) => ['reviews', 'tutor', tutorId] as const,
  },
  notifications: { all: ['notifications'] as const },
  favorites: { all: ['favorites'] as const },
  admin: {
    pendingTutors: ['admin', 'pendingTutors'] as const,
    users: (params: unknown) => ['admin', 'users', params] as const,
    posts: (params: unknown) => ['admin', 'posts', params] as const,
    transactions: (params: unknown) => ['admin', 'transactions', params] as const,
    feeRates: ['admin', 'feeRates'] as const,
    complaints: ['admin', 'complaints'] as const,
    stats: ['admin', 'stats'] as const,
  },
}
