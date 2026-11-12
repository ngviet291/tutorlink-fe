import type { CursorResponse } from "@/shared/types/api.types";
import type { PostGateway } from "../api/post.gateway";
import {
  toCreatePostRequest,
  toPost,
  toUpdatePostRequest,
} from "../mapper/post.mapper";
import type {
  AdminPostFilter,
  MyPostFilter,
  PostApplication,
  PostFilter,
  PostPayload,
  PostResponse,
  PostStatistic,
} from "../types/post.types";

/** Map content sang model UI, giữ nguyên hasNext và nextCursor. */
const mapPage = <D, M>(
  res: CursorResponse<D>,
  fn: (d: D) => M,
): CursorResponse<M> => ({
  ...res,
  content: res.content.map(fn),
});

export class PostService {
  private readonly gateway: PostGateway;

  constructor(gateway: PostGateway) {
    this.gateway = gateway;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLIC POSTS
  // ─────────────────────────────────────────────────────────────────────────

  async getPosts(
    filter: PostFilter,
  ): Promise<CursorResponse<PostResponse>> {
    return mapPage(
      await this.gateway.list(filter),
      toPost,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MY POSTS
  // ─────────────────────────────────────────────────────────────────────────

  async getMyPosts(
    filter: MyPostFilter,
  ): Promise<CursorResponse<PostResponse>> {
    return mapPage(
      await this.gateway.listMine(filter),
      toPost,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN POSTS
  // ─────────────────────────────────────────────────────────────────────────

  async getAdminPosts(
    filter: AdminPostFilter,
  ): Promise<CursorResponse<PostResponse>> {
    return mapPage(
      await this.gateway.listAdmin(filter),
      toPost,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // POST DETAIL
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * GET /v1/posts/:id
   * Chi tiết bài đăng công khai.
   */
  async getPostById(
    postId: string,
  ): Promise<PostResponse> {
    return toPost(
      await this.gateway.getById(postId),
    );
  }

  /**
   * GET /v1/posts/:id/me
   * Chi tiết bài đăng của chính user hiện tại.
   *
   * Dùng cho DRAFT / CLOSED / REMOVED hoặc các bài
   * mà public endpoint không cho xem.
   */
  async getPostByIdForMe(
    postId: string,
  ): Promise<PostResponse> {
    return toPost(
      await this.gateway.getByIdForMe(postId),
    );
  }

  /**
   * GET /v1/admin/posts/:id
   * Chi tiết bài đăng dành cho ADMIN.
   */
  async getPostByIdForAdmin(
    postId: string,
  ): Promise<PostResponse> {
    return toPost(
      await this.gateway.getByIdForAdmin(postId),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // APPLICATIONS
  // ─────────────────────────────────────────────────────────────────────────

  async getPostApplications(
    postId: string,
    cursor?: string,
    limit?: number,
  ): Promise<CursorResponse<PostApplication>> {
    return this.gateway.listApplications(
      postId,
      cursor,
      limit,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CREATE
  // ─────────────────────────────────────────────────────────────────────────

  async createPost(
    payload: PostPayload,
    asDraft = false,
  ): Promise<PostResponse> {
    return toPost(
      await this.gateway.create(
        toCreatePostRequest(
          payload,
          asDraft,
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UPDATE
  // ─────────────────────────────────────────────────────────────────────────

  async updatePost(
    postId: string,
    payload: PostPayload,
  ): Promise<PostResponse> {
    return toPost(
      await this.gateway.update(
        postId,
        toUpdatePostRequest(payload),
      ),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PUBLISH
  // ─────────────────────────────────────────────────────────────────────────

  async publishPost(
    postId: string,
  ): Promise<PostResponse> {
    return toPost(
      await this.gateway.publish(postId),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CLOSE
  // ─────────────────────────────────────────────────────────────────────────

  async closePost(
    postId: string,
  ): Promise<void> {
    return this.gateway.close(postId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────────────────

  async deletePost(
    postId: string,
  ): Promise<void> {
    return this.gateway.delete(postId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ADMIN REMOVE
  // ─────────────────────────────────────────────────────────────────────────

  async removePostByAdmin(
    postId: string,
    reason?: string,
  ): Promise<void> {
    return this.gateway.removeByAdmin(
      postId,
      reason,
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STATISTICS
  // ─────────────────────────────────────────────────────────────────────────

  getStatistics(): Promise<PostStatistic[]> {
    return this.gateway.statisticsByStatus();
  }
}