import { ERROR_MESSAGES } from '@/constants/errorMessage'
import { ApiError } from '@/shared/types/api.types'

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return ERROR_MESSAGES.UNKNOWN
}

export function getErrorCode(error: unknown): string | undefined {
  return error instanceof ApiError ? error.code : undefined
}
