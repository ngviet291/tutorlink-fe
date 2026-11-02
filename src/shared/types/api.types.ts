export interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

export interface CursorResponse<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export interface PageResponse<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface ApiErrorBody {
  code?: string
  message?: string
}

export class ApiError extends Error {
  code?: string
  status?: number

  constructor(message: string, code?: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}
