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
  async getPostById(id: string): Promise<PostResponse> {
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
        // Người dùng chưa đăng nhập
      }

      if (!post || !canSee(post, viewerId, isAdmin)) {
        throw new ApiError(ERROR_MESSAGES.NOT_FOUND, "NOT_FOUND", 404);
      }

      return withCount(post);
    }

    const response = await http.get<PostResponse>(`/v1/posts/${id}`);

    return response.data;
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
      ...payload,
      status: asDraft ? "DRAFT" : "PUBLISHED",
    });

    return response.data;
  },

  /** PUT /v1/posts/:id - Cập nhật bài đăng */
  async updatePost(id: string, payload: PostPayload): Promise<PostResponse> {
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
        ...toPost(payload, id, oldPost.status),
        createdAt: oldPost.createdAt,
      };

      posts[index] = updated;
      recountSubjectUsage();

      return withCount(updated);
    }

    const response = await http.put<PostResponse>(`/v1/posts/${id}`, payload);

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
