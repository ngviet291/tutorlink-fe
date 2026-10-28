import { http } from '@/config/axiosClient'
import { env } from '@/config/env'
import type { PageResponse } from '@/shared/types/api.types'
import { ApiError } from '@/shared/types/api.types'
import { ERROR_MESSAGES } from '@/constants/errorMessage'
import type { PostFilter, PostPayload, PostResponse } from '../types/post.types'
import { applications, nextId, notifications, posts, recountSubjectUsage, subjects, users } from '@/mocks/db'
import { delay, paginate, requireUser } from '@/mocks/session'
import { LOCKED_PHONE } from '@/shared/utils/maskContact'

const USE_MOCK = env.useMock

/** Bài PUBLISHED luôn hiển thị; chủ bài và admin xem được mọi trạng thái. */
function canSee(post: PostResponse, viewerId: string | null, isAdmin: boolean): boolean {
  if (isAdmin) return true
  if (post.status === 'PUBLISHED' || post.status === 'CLOSED') return true
  return post.author.id === viewerId
}

function withCount(p: PostResponse): PostResponse {
  const n = applications.filter((a) => a.post.id === p.id && a.status !== 'CANCELLED').length
  // Không bao giờ trả thông tin liên hệ thật của người đăng trong danh sách/chi tiết
  return { ...p, applicationCount: n, author: { ...p.author, maskedPhone: LOCKED_PHONE, contact: undefined } }
}

function matches(p: PostResponse, f: PostFilter): boolean {
  if (f.type && p.type !== f.type) return false
  if (f.subjectId && p.subject.id !== f.subjectId) return false
  if (f.city && p.address.city !== f.city) return false
  if (f.teachingMode && p.teachingMode !== f.teachingMode && p.teachingMode !== 'BOTH') return false
  if (f.educationLevels?.length && !f.educationLevels.includes(p.educationLevel)) return false
  if (f.minBudget !== undefined && p.maxBudget < f.minBudget) return false
  if (f.maxBudget !== undefined && p.minBudget > f.maxBudget) return false
  if (f.status && p.status !== f.status) return false
  if (f.keyword) {
    const k = f.keyword.toLowerCase()
    if (!`${p.title} ${p.content} ${p.subject.name}`.toLowerCase().includes(k)) return false
  }
  return true
}

function toPost(payload: PostPayload, id: string, status: PostResponse['status']): PostResponse {
  const me = requireUser()
  const subject = subjects.find((s) => s.id === payload.subjectId)
  if (!subject) throw new ApiError('Môn học không hợp lệ', 'INVALID_SUBJECT', 400)
  return {
    id, title: payload.title, content: payload.content, type: payload.type, status,
    author: { id: me.id, fullName: me.fullName, avatarUrl: me.avatarUrl, role: me.role, maskedPhone: LOCKED_PHONE },
    subject: { id: subject.id, name: subject.name }, educationLevel: payload.educationLevel,
    teachingMode: payload.teachingMode, address: { city: payload.city, district: payload.district, detail: payload.detail },
    minBudget: payload.minBudget, maxBudget: payload.maxBudget, sessionsPerWeek: payload.sessionsPerWeek,
    durationMinutes: payload.durationMinutes, deadline: new Date(payload.deadline).toISOString(), createdAt: new Date().toISOString(),
  }
}

export const postService = {
  /** Danh sách công khai (Guest chỉ thấy PUBLISHED). */
  async getPosts(params: PostFilter = {}): Promise<PageResponse<PostResponse>> {
    if (USE_MOCK) {
      await delay()
      const all = posts.filter((p) => p.status === 'PUBLISHED').filter((p) => matches(p, { ...params, status: undefined }))
      all.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      const page = paginate(all, params.page, params.pageSize)
      return { ...page, items: page.items.map(withCount) }
    }
    return http.get<PageResponse<PostResponse>>('/v1/posts', { params })
  },

  async getPostById(id: string): Promise<PostResponse> {
    if (USE_MOCK) {
      await delay(250)
      const post = posts.find((p) => p.id === id)
      let viewerId: string | null = null
      let isAdmin = false
      try {
        const me = requireUser()
        viewerId = me.id
        isAdmin = me.role === 'ADMIN'
      } catch {
        /* guest */
      }
      if (!post || !canSee(post, viewerId, isAdmin)) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      return withCount(post)
    }
    return http.get<PostResponse>(`/v1/posts/${id}`)
  },

  async createPost(payload: PostPayload, asDraft = true): Promise<PostResponse> {
    if (USE_MOCK) {
      await delay()
      const post = toPost(payload, nextId('p'), asDraft ? 'DRAFT' : 'PUBLISHED')
      posts.unshift(post)
      recountSubjectUsage()
      return withCount(post)
    }
    return http.post<PostResponse>('/v1/posts', { ...payload, status: asDraft ? 'DRAFT' : 'PUBLISHED' })
  },

  async updatePost(id: string, payload: PostPayload): Promise<PostResponse> {
    if (USE_MOCK) {
      await delay()
      const idx = posts.findIndex((p) => p.id === id)
      const old = posts[idx]
      if (!old) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      if (old.status === 'CLOSED') throw new ApiError('Bài đã ghép cặp, không thể chỉnh sửa.', 'POST_CLOSED', 409)
      const updated = { ...toPost(payload, id, old.status), createdAt: old.createdAt }
      posts[idx] = updated
      recountSubjectUsage()
      return withCount(updated)
    }
    return http.put<PostResponse>(`/v1/posts/${id}`, payload)
  },

  async deletePost(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay()
      const idx = posts.findIndex((p) => p.id === id)
      const post = posts[idx]
      if (!post) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      if (post.status === 'CLOSED') throw new ApiError('Bài đã ghép cặp, không thể xóa.', 'POST_CLOSED', 409)
      posts.splice(idx, 1)
      recountSubjectUsage()
      return
    }
    await http.delete(`/v1/posts/${id}`)
  },

  async getMyPosts(): Promise<PostResponse[]> {
    if (USE_MOCK) {
      await delay()
      const me = requireUser()
      return posts.filter((p) => p.author.id === me.id).map(withCount)
    }
    return http.get<PostResponse[]>('/v1/posts/me')
  },

  async publishPost(id: string): Promise<PostResponse> {
    if (USE_MOCK) {
      await delay()
      const post = posts.find((p) => p.id === id)
      if (!post) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, 'NOT_FOUND', 404)
      post.status = 'PUBLISHED'
      const owner = users.find((u) => u.id === post.author.id)
      if (owner) {
        notifications[owner.id] = [
          { id: nextId('n'), type: 'POST_PUBLISHED', title: 'Bài đăng đã được đăng công khai', body: post.title, read: false, createdAt: new Date().toISOString(), link: `/post/${post.id}` },
          ...(notifications[owner.id] ?? []),
        ]
      }
      return withCount(post)
    }
    return http.put<PostResponse>(`/v1/posts/${id}/publish`)
  },
}
