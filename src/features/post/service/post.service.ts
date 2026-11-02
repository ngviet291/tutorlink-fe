import { http } from "@/config/axiosClient";
import { env, mockConfig } from "@/config/env";
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
  if (f.subjectId && p.subject.id !== f.subjectId) return false;
  if (f.province && p.address.province !== f.province) return false;
  if (
    f.teachingMode &&
    p.teachingMode !== f.teachingMode &&
    p.teachingMode !== "BOTH"
  )
    return false;
  if (
    f.educationLevels?.length &&
    !f.educationLevels.includes(p.educationLevel)
  )
    return false;
  if (f.minBudget !== undefined && p.maxBudget < f.minBudget) return false;
  if (f.maxBudget !== undefined && p.minBudget > f.maxBudget) return false;
  if (f.postStatus && p.postStatus !== f.postStatus) return false;
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
    sessionsPerWeek: payload.sessionsPerWeek,
    durationMinutes: payload.durationMinutes,
    deadline: new Date(payload.deadline).toISOString(),
    createdAt: new Date().toISOString(),
  };
}

export const postService = {
  async getPosts(
    params: PostFilter = {},
  ): Promise<CursorResponse<PostResponse>> {
    if (USE_MOCK) {
      await delay();
      const all = posts
        .filter((p) => p.postStatus === "PUBLISHED")
        .filter((p) => matches(p, { ...params, postStatus: undefined }))
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      return cursorPaginate(
        all,
        params.cursor,
        (p) => p.id,
        params.limit ?? 10,
      );
    }
    return http
      .get<CursorResponse<PostResponse>>("/v1/posts")
      .then((res) => res.data);
  },

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
    return http.get<PostResponse>(`/v1/posts/${id}`).then((res) => res.data);
  },

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
    return http
      .post<PostResponse>("/v1/posts", {
        ...payload,
        postStatus: asDraft ? "DRAFT" : "PUBLISHED",
      })
      .then((res) => res.data);
  },

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
    return http
      .put<PostResponse>(`/v1/posts/${id}`, payload)
      .then((res) => res.data);
  },

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

  async getMyPosts(): Promise<PostResponse[]> {
    if (USE_MOCK) {
      await delay();
      const me = requireUser();
      return posts.filter((p) => p.author.id === me.id).map(withCount);
    }
    return http.get<PostResponse[]>("/v1/posts/me").then((res) => res.data);
  },

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
    return http
      .patch<PostResponse>(`/v1/posts/${id}/publish`)
      .then((res) => res.data);
  },

  /** Chủ bài đóng bài: PUBLISHED → CLOSED (không nhận thêm ứng tuyển). */
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
    await http.patch<void>(`/v1/posts/${id}/close`);
  },
};
