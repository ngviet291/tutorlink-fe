import { http } from "@/config/axiosClient";
import { tokenStorage } from "@/config/di/container";
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

// ─── Mock helpers ────────────────────────────────────────────────────────────

function canSee(
  post: PostResponse,
  viewerId: string | null,
  isAdmin: boolean,
): boolean {
  if (isAdmin) return true;

  if (post.status === "PUBLISHED" || post.status === "CLOSED") {
    return true;
  }

  return post.author.id === viewerId;
}

function withCount(post: PostResponse): PostResponse {
  const applicationCount = applications.filter(
    (application) =>
      application.post.id === post.id &&
      application.applicationStatus !== "CANCELLED",
  ).length;

  return { ...post, applicationCount };
}

function matches(post: PostResponse, filter: PostFilter): boolean {
  if (filter.authorId && post.author.id !== filter.authorId) return false;

  if (filter.type && post.type !== filter.type) return false;

  if (
    filter.subjectName &&
    !post.subject.name.toLowerCase().includes(filter.subjectName.toLowerCase())
  ) {
    return false;
  }

  if (filter.province && post.address?.province !== filter.province) {
    return false;
  }

  if (
    filter.teachingMode &&
    post.teachingMode !== filter.teachingMode &&
    post.teachingMode !== "BOTH"
  ) {
    return false;
  }

  if (filter.educationLevel && post.educationLevel !== filter.educationLevel) {
    return false;
  }

  if (
    filter.minBudget !== undefined &&
    (post.maxBudget ?? Infinity) < filter.minBudget
  ) {
    return false;
  }

  if (
    filter.maxBudget !== undefined &&
    (post.minBudget ?? 0) > filter.maxBudget
  ) {
    return false;
  }

  if (filter.keyword) {
    const keyword = filter.keyword.toLowerCase();
    const searchableText =
      `${post.title} ${post.content} ${post.subject.name}`.toLowerCase();

    if (!searchableText.includes(keyword)) return false;
  }

  return true;
}

/**
 * Form dùng <input type="date"> ("YYYY-MM-DD") nhưng BE nhận `Instant` (ISO-8601).
 * Gửi cuối ngày theo giờ Việt Nam (UTC+7) để hạn chót không bị lùi một ngày.
 */
function toApiPayload(payload: PostPayload) {
  const d = payload.deadline;
  const deadline = /^\d{4}-\d{2}-\d{2}$/.test(d)
    ? new Date(`${d}T23:59:59+07:00`).toISOString()
    : d;
  // BE validate AddressRequest (street, ward, province đều bắt buộc) nếu có gửi `address`:
  // dạy ONLINE hoặc địa chỉ chưa đủ thì bỏ hẳn field thay vì gửi object rỗng.
  const a = payload.address;
  const fullAddress = Boolean(
    a?.street?.trim() && a?.ward?.trim() && a?.province?.trim(),
  );
  return {
    ...payload,
    deadline,
    address: payload.teachingMode !== "ONLINE" && fullAddress ? a : undefined,
  };
}

/** PostResponse → PostPayload (dùng khi chỉ muốn đổi trạng thái bài, vd chuyển về nháp). */
export function toPostPayload(post: PostResponse): PostPayload {
  return {
    type: post.type,
    title: post.title,
    content: post.content,
    subjectId: post.subject.id,
    educationLevel: post.educationLevel,
    teachingMode: post.teachingMode,
    address: post.address ?? {},
    minBudget: post.minBudget,
    maxBudget: post.maxBudget,
    budgetUnit: post.budgetUnit,
    sessionsPerWeek: post.sessionsPerWeek,
    durationMinutes: post.durationMinutes,
    deadline: post.deadline,
  };
}

function toPost(
  payload: PostPayload,
  id: string,
  status: PostResponse["status"],
): PostResponse {
  const me = requireUser();
  const subject = subjects.find((item) => item.id === payload.subjectId);

  if (!subject) {
    throw new ApiError("Invalid subject", "INVALID_SUBJECT", 400);
  }

  return {
    id,
    title: payload.title,
    content: payload.content,
    type: payload.type,
    status,
    author: {
      id: me.id,
      fullName: me.fullName,
      avatarUrl: me.avatarUrl,
      role: me.role,
    },
    subject: {
      id: subject.id,
      name: subject.name,
    },
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

// ─── API service ─────────────────────────────────────────────────────────────

export const postService = {
  /** GET /v1/posts - Danh sách bài đăng công khai */
  async getPosts(
    params: PostFilter = {},
  ): Promise<CursorResponse<PostResponse>> {
    if (USE_MOCK) {
      await delay();

      const all = posts
        .filter((post) => post.status === "PUBLISHED")
        .filter((post) => matches(post, params))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

      return cursorPaginate(
        all,
        params.cursor,
        (post) => post.id,
        params.limit ?? 10,
      );
    }

    const response = await http.get<CursorResponse<PostResponse>>("/v1/posts", {
      params,
    });

    return response.data;
  },

  /** GET /v1/posts/:id - Chi tiết bài đăng */
  async getPostById(id: string, mine = false): Promise<PostResponse> {
    if (!id) throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
    if (USE_MOCK) {
      await delay(250);

      const post = posts.find((item) => item.id === id);

      let viewerId: string | null = null;
      let isAdmin = false;

      try {
        const me = requireUser();
        viewerId = me.id;
        isAdmin = me.role === "ADMIN";
      } catch {
      }

      if (!post || !canSee(post, viewerId, isAdmin)) {
        throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      }

      return withCount(post);
    }

    if (mine) {
      const own = await http.get<PostResponse>(`/v1/posts/${id}/me`);
      return own.data;
    }
    try {
      const response = await http.get<PostResponse>(`/v1/posts/${id}`);
      return response.data;
    } catch (err) {
      const status =
        (err as { status?: number })?.status ??
        (err as { response?: { status?: number } })?.response?.status;
      const loggedIn = Boolean(await tokenStorage.getAccessToken());
      if (status !== 404 || !loggedIn) throw err;
      const mine = await http.get<PostResponse>(`/v1/posts/${id}/me`);
      return mine.data;
    }
  },

  /** POST /v1/posts - Tạo bài đăng */
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

    const response = await http.post<PostResponse>("/v1/posts", {
      ...toApiPayload(payload),
      status: asDraft ? "DRAFT" : "PUBLISHED",
    });

    return response.data;
  },

  /** PUT /v1/posts/:id - Cập nhật bài đăng. `status` DRAFT = lưu nháp (gỡ khỏi công khai), PUBLISHED = đăng công khai. */
  async updatePost(
    id: string,
    payload: PostPayload,
    status: "DRAFT" | "PUBLISHED" = "PUBLISHED",
  ): Promise<PostResponse> {
    if (USE_MOCK) {
      await delay();

      const index = posts.findIndex((post) => post.id === id);
      const oldPost = posts[index];

      if (!oldPost) {
        throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      }

      if (oldPost.status === "CLOSED") {
        throw new ApiError("Post is closed", "POST_CLOSED", 409);
      }

      const updated = {
        ...toPost(payload, id, status),
        createdAt: oldPost.createdAt,
      };

      posts[index] = updated;
      recountSubjectUsage();

      return withCount(updated);
    }

    const response = await http.put<PostResponse>(`/v1/posts/${id}`, {
      ...toApiPayload(payload),
      status,
    });

    return response.data;
  },

  /** DELETE /v1/posts/:id - Xóa bài đăng */
  async deletePost(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();

      const index = posts.findIndex((post) => post.id === id);
      const post = posts[index];

      if (!post) {
        throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      }

      if (post.status === "CLOSED") {
        throw new ApiError("Post is closed", "POST_CLOSED", 409);
      }

      posts.splice(index, 1);
      recountSubjectUsage();

      return;
    }

    await http.delete(`/v1/posts/${id}`);
  },

  /** GET /v1/posts/me - Danh sách bài đăng của người dùng hiện tại */
  async getMyPosts(
    params: PostFilter = {},
  ): Promise<CursorResponse<PostResponse>> {
    if (USE_MOCK) {
      await delay();

      const me = requireUser();

      const all = posts
        .filter((post) => post.author.id === me.id)
        .filter((post) => matches(post, params))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

      return cursorPaginate(
        all.map(withCount),
        params.cursor,
        (post) => post.id,
        params.limit ?? 10,
      );
    }

    const response = await http.get<CursorResponse<PostResponse>>(
      "/v1/posts/me",
      { params },
    );

    console.log("[MY POSTS DATA]", response.data);

    return response.data;
  },

  /** PATCH /v1/posts/:id/publish - Đăng bài */
  async publishPost(id: string): Promise<PostResponse> {
    if (USE_MOCK) {
      await delay();

      const post = posts.find((item) => item.id === id);

      if (!post) {
        throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      }

      post.status = "PUBLISHED";

      const owner = users.find((user) => user.id === post.author.id);

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

    const response = await http.patch<PostResponse>(`/v1/posts/${id}/publish`);

    return response.data;
  },

  /** PATCH /v1/posts/:id/close - Đóng bài đăng */
  async closePost(id: string): Promise<void> {
    if (USE_MOCK) {
      await delay();

      const me = requireUser();
      const post = posts.find((item) => item.id === id);

      if (!post) {
        throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      }

      if (post.author.id !== me.id) {
        throw new ApiError(ERROR_MESSAGES.FORBIDDEN, "FORBIDDEN", 403);
      }

      if (post.status !== "PUBLISHED") {
        throw new ApiError(
          "Chỉ đóng được bài đang đăng.",
          "INVALID_STATE",
          409,
        );
      }

      post.status = "CLOSED";
      return;
    }

    await http.patch(`/v1/posts/${id}/close`);
  },
};
