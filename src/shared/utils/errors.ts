import { ApiError } from '@/shared/types/api.types'
import i18n from '@/app/i18n'

const CODE_TO_I18N: Record<string, string> = {
  INVALID_CREDENTIALS: 'error.invalidCredentials',
  EMAIL_EXISTS: 'error.emailExists',
  ALREADY_APPLIED: 'error.alreadyApplied',
  OWN_POST: 'error.ownPost',
  TUTOR_NOT_APPROVED: 'error.tutorNotApproved',
  INSUFFICIENT_BALANCE: 'error.insufficientBalance',
  ACCOUNT_LOCKED: 'error.accountLocked',
  AI_UNAVAILABLE: 'error.aiUnavailable',
  UNAUTHORIZED: 'error.unauthorized',
  FORBIDDEN: 'error.forbidden',
  NOT_FOUND: 'error.notFound',
  INVALID_SUBJECT: 'error.unknown',
  POST_CLOSED: 'error.postClosed',
  WRONG_PASSWORD: 'error.wrongPassword',
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code && CODE_TO_I18N[error.code]) {
      return i18n.t(CODE_TO_I18N[error.code])
    }
    if (error.status === 401) return i18n.t('error.unauthorized')
    if (error.status === 403) return i18n.t('error.forbidden')
    if (error.status === 404) return i18n.t('error.notFound')
    if (error.message) return error.message
  }
  if (error instanceof Error) {
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return i18n.t('error.network')
    }
    return error.message
  }
  return i18n.t('error.unknown')
}
