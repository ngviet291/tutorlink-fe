import { http } from "@/config/axiosClient";
import { mockConfig } from "@/config/env";
import { ApiError, type CursorResponse } from "@/shared/types/api.types";
import { ERROR_MESSAGES } from "@/constants/errorMessage";
import type {
  PostFilter,
  PostPayload,
  PostResponse,
} from "../types/post.types";
import {
  applications,
  nextId,
  notifications,
  posts,
  recountSubjectUsage,
  subjects,
  users,
} from "@/mocks/db";
import { delay, cursorPaginate, requireUser } from "@/mocks/session";

const USE_MOCK = mockConfig.post;

// ─── Kiểu BE trả về (status thay vì postStatus) ──────────────────────────────

interface BePostResponse extends Omit<PostResponse, "postStatus"> {
  status: PostResponse["postStatus"];
}

/** Map field `status` của BE → `postStatus` mà FE dùng. */
function fromBe(raw: BePostResponse): PostResponse {
  const { status, ...rest } = raw;
  return { ...rest, postStatus: status };
}

// ─── Mock helpers ─────────────────────────────────────────────────────────────

function canSee(
  post: PostResponse,
  viewerId: string | null,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;
  if (post.postStatus === "PUBLISHED" || post.postStatus === "CLOSED")
    return true;
  return post.author.id === viewerId;
}

function withCount(p: PostResponse): PostResponse {
  const n = applications.filter(
    (a) => a.post.id === p.id && a.applicationStatus !== "CANCELLED",
  ).length;
  return { ...p, applicationCount: n };
}

function matches(p: PostResponse, f: PostFilter): boolean {
  if (f.type && p.type !== f.type) return false;
  if (
    f.subjectName &&
    !p.subject.name.toLowerCase().includes(f.subjectName.toLowerCase())
  )
    return false;
  if (f.province && p.address?.province !== f.province) return false;
  if (
    f.teachingMode &&
    p.teachingMode !== f.teachingMode &&
    p.teachingMode !== "BOTH"
  )
    return false;
  if (f.educationLevel && p.educationLevel !== f.educationLevel) return false;
  // Ngân sách null = không giới hạn (max) hoặc từ 0 (min)
  if (f.minBudget !== undefined && (p.maxBudget ?? Infinity) < f.minBudget)
    return false;
  if (f.maxBudget !== undefined && (p.minBudget ?? 0) > f.maxBudget)
    return false;
  if (f.keyword) {
    const k = f.keyword.toLowerCase();
    if (!`${p.title} ${p.content} ${p.subject.name}`.toLowerCase().includes(k))
      return false;
  }
  return true;
}

function toPost(
  payload: PostPayload,
  id: string,
  postStatus: PostResponse["postStatus"],
): PostResponse {
  const me = requireUser();
  const subject = subjects.find((s) => s.id === payload.subjectId);
  if (!subject) throw new ApiError("Invalid subject", "INVALID_SUBJECT", 400);
  return {
    id,
    title: payload.title,
    content: payload.content,
    type: payload.type,
    postStatus,
    author: {
      id: me.id,
      fullName: me.fullName,
      avatarUrl: me.avatarUrl,
      role: me.role,
    },
    subject: { id: subject.id, name: subject.name },
    educationLevel: payload.educationLevel,
    teachingMode: payload.teachingMode,
    address: payload.address,
    minBudget: payload.minBudget,
    maxBudget: payload.maxBudget,
    budgetUnit: payload.budgetUnit,
    sessionsPerWeek: payload.sessionsPerWeek,
    durationMinutes: payload.durationMinutes,
    deadline: new Date(payload.deadline).toISOString(),
    createdAt: new Date().toISOString(),
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const postService = {
  /** GET /v1/posts — public, cursor-based pagination */
  async getPosts(
    params: PostFilter = {},
  ): Promise<CursorResponse<PostResponse>> {
    if (USE_MOCK) {
      await delay();
      const all = posts
        .filter((p) => p.postStatus === "PUBLISHED")
        .filter((p) => matches(p, params))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      return cursorPaginate(
        all,
        params.cursor,
        (p) => p.id,
        params.limit ?? 10,
      );
    }
    // Chuyển params FE → query string BE:
    //   subjectName → subjectName (đã đúng tên BE)
    //   educationLevel → educationLevel (đã đúng)
    //   bỏ field rỗng/undefined để không gửi query param thừa
    const { educationLevel, teachingMode, ...rest } = params;
    const query = {
      ...rest,
      ...(educationLevel ? { educationLevel } : {}),
      ...(teachingMode ? { teachingMode } : {}),
    };
    const { data: raw } = await http.get<CursorResponse<BePostResponse>>(
      "/v1/posts",
      { params: query },
    );
    return { ...raw, content: (raw.content ?? []).map(fromBe) };
  },

  /** GET /v1/posts/:id — public */
  async getPostById(id: string): Promise<PostResponse> {
    if (USE_MOCK) {
      await delay(250);
      const post = posts.find((p) => p.id === id);
      let viewerId: string | null = null;
      let isAdmin = false;
      try {
        const me = requireUser();
        viewerId = me.id;
        isAdmin = me.role === "ADMIN";
      } catch {
        /* guest */
      }
      if (!post || !canSee(post, viewerId, isAdmin)) {
        throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      }
      return withCount(post);
    }
    return fromBe((await http.get<BePostResponse>(`/v1/posts/${id}`)).data);
  },

  /** POST /v1/posts — tạo bài đăng mới */
  async createPost(
    payload: PostPayload,
    asDraft = true,
  ): Promise<PostResponse> {
    if (USE_MOCK) {
      await delay();
      const post = toPost(
        payload,
        nextId("p"),
        asDraft ? "DRAFT" : "PUBLISHED",
      );
      posts.unshift(post);
      recountSubjectUsage();
      return withCount(post);
    }
    // BE nhận `status` trong body (không phải postStatus)
    const { data: raw } = await http.post<BePostResponse>("/v1/posts", {
      ...payload,
      status: asDraft ? "DRAFT" : "PUBLISHED",
    });
    return fromBe(raw);
  },

  /** PUT /v1/posts/:id — cập nhật bài đăng */
  async updatePost(id: string, payload: PostPayload): Promise<PostResponse> {
    if (USE_MOCK) {
      await delay();
      const idx = posts.findIndex((p) => p.id === id);
      const old = posts[idx];
      if (!old) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      if (old.postStatus === "CLOSED")
        throw new ApiError("Post is closed", "POST_CLOSED", 409);
      const updated = {
        ...toPost(payload, id, old.postStatus),
        createdAt: old.createdAt,
      };
      posts[idx] = updated;
      recountSubjectUsage();
      return withCount(updated);
    }
    return fromBe(
      (await http.put<BePostResponse>(`/v1/posts/${id}`, payload)).data,
    );
  },

  /** DELETE /v1/posts/:id — xóa bài đăng */
  async deletePost(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      const idx = posts.findIndex((p) => p.id === id);
      const post = posts[idx];
      if (!post) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      if (post.postStatus === "CLOSED")
        throw new ApiError("Post is closed", "POST_CLOSED", 409);
      posts.splice(idx, 1);
      recountSubjectUsage();
      return;
    }
    await http.delete(`/v1/posts/${id}`);
  },

  /**
   * GET /v1/posts/me — bài đăng của người dùng hiện tại.
   * BE trả CursorResponse, dùng useInfiniteQuery ở usePosts.ts.
   */
  async getMyPosts(
    params: PostFilter = {},
  ): Promise<CursorResponse<PostResponse>> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      const all = posts
        .filter((p) => p.author.id === me.id)
        .filter((p) => matches(p, params))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      return cursorPaginate(
        all.map(withCount),
        params.cursor,
        (p) => p.id,
        params.limit ?? 10,
      );
    }
    const { data: raw } = await http.get<CursorResponse<BePostResponse>>(
      "/v1/posts/me",
      { params },
    );
    return { ...raw, content: (raw.content ?? []).map(fromBe) };
  },

  /** PATCH /v1/posts/:id/publish — admin duyệt bài */
  async publishPost(id: string): Promise<PostResponse> {
    if (USE_MOCK) {
      await delay();
      const post = posts.find((p) => p.id === id);
      if (!post) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      post.postStatus = "PUBLISHED";
      const owner = users.find((u) => u.id === post.author.id);
      if (owner) {
        notifications[owner.id] = [
          {
            id: nextId("n"),
            notificationType: "SYSTEM",
            title: "Bài đăng đã được đăng công khai",
            content: post.title,
            isRead: false,
            createdAt: new Date().toISOString(),
          },
          ...(notifications[owner.id] ?? []),
        ];
      }
      return withCount(post);
    }
    return fromBe(
      (await http.patch<BePostResponse>(`/v1/posts/${id}/publish`)).data,
    );
  },

  /** PATCH /v1/posts/:id/close — chủ bài đóng bài (PUBLISHED → CLOSED) */
  async closePost(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      const post = posts.find((p) => p.id === id);
      if (!post) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      if (post.author.id !== me.id)
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, "FORBIDDEN", 403);
      if (post.postStatus !== "PUBLISHED")
        throw new ApiError(
          "Chỉ đóng được bài đang đăng.",
          "INVALID_STATE",
          409,
        );
      post.postStatus = "CLOSED";
      return;
    }
    await http.patch(`/v1/posts/${id}/close`);
  },
};
