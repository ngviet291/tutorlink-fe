export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  posts: {
    all: ['posts'] as const,
    list: (params: object) => ['posts', 'list', params] as const,
    mine: ['posts', 'mine'] as const,
    detail: (id: string) => ['posts', 'detail', id] as const,
  },
  tutors: {
    all: ['tutors'] as const,
    list: (params: object) => ['tutors', 'list', params] as const,
    detail: (id: string) => ['tutors', 'detail', id] as const,
    me: ['tutors', 'me'] as const,
  },
  applications: {
    all: ['applications'] as const,
    mine: ['applications', 'mine'] as const,
    connections: ['applications', 'connections'] as const,
    byPost: (postId: string) => ['applications', 'post', postId] as const,
    aiTop5: (postId: string) => ['applications', 'ai-top5', postId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    mine: ['notifications', 'mine'] as const,
  },
  wallet: {
    all: ['wallet'] as const,
    me: ['wallet', 'me'] as const,
    balance: ['wallet', 'balance'] as const,
    transactions: (params: object) => ['wallet', 'transactions', params] as const,
    quote: (applicationId: string) => ['wallet', 'quote', applicationId] as const,
  },
  subjects: {
    all: ['subjects'] as const,
  },
  chat: {
    all: ['chat'] as const,
    channels: ['chat', 'channels'] as const,
    channel: (channelId: string) => ['chat', 'channel', channelId] as const,
    withPartner: (partnerId: string) => ['chat', 'with', partnerId] as const,
    messages: (channelId: string) => ['chat', 'messages', channelId] as const,
    unread: ['chat', 'unread'] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    byTutor: (tutorId: string) => ['reviews', 'tutor', tutorId] as const,
    byApplication: (id: string) => ['reviews', 'application', id] as const,
  },
  favorites: {
    all: ['favorites'] as const,
    mine: ['favorites', 'mine'] as const,
    ids: ['favorites', 'ids'] as const,
  },
}
