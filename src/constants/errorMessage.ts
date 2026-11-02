// Error message strings used in ApiError constructor.
// The CODE is what getErrorMessage maps to i18n; message is a fallback.
export const ERROR_MESSAGES = {
  NETWORK: 'Cannot connect to server.',
  UNKNOWN: 'An error occurred.',
  UNAUTHORIZED: 'Session expired. Please log in again.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'Requested resource not found.',
  INVALID_CREDENTIALS: 'Incorrect email or password.',
  EMAIL_EXISTS: 'This email is already registered.',
  ALREADY_APPLIED: 'You have already applied to this post.',
  OWN_POST: 'You cannot apply to your own post.',
  TUTOR_NOT_APPROVED: 'Your tutor profile has not been approved yet.',
  INSUFFICIENT_BALANCE: 'Insufficient wallet balance.',
  ACCOUNT_LOCKED: 'Account locked. Please contact admin.',
  AI_UNAVAILABLE: 'AI service temporarily unavailable.',
  SUBJECT_IN_USE: 'Cannot delete a subject that is in use.',
} as const
