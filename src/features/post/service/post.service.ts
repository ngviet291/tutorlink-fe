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
): CursorResponse<M> => ({ ...res, content: res.content.map(fn) });

export class PostService {
  private readonly gateway: PostGateway;

  constructor(gateway: PostGateway) {
    this.gateway = gateway;
  }

  async getPosts(filter: PostFilter): Promise<CursorResponse<PostResponse>> {
    return mapPage(await this.gateway.list(filter), toPost);
  }

  async getMyPosts(
    filter: MyPostFilter,
  ): Promise<CursorResponse<PostResponse>> {
    return mapPage(await this.gateway.listMine(filter), toPost);
  }

  async getAdminPosts(
    filter: AdminPostFilter,
  ): Promise<CursorResponse<PostResponse>> {
    return mapPage(await this.gateway.listAdmin(filter), toPost);
  }

  async getPostById(postId: string): Promise<PostResponse> {
    return toPost(await this.gateway.getById(postId));
  }

  async getPostByIdForMe(postId: string): Promise<PostResponse> {
    return toPost(await this.gateway.getByIdForMe(postId));
  }

  async getPostApplications(
    postId: string,
    cursor?: string,
    limit?: number,
  ): Promise<CursorResponse<PostApplication>> {
    return this.gateway.listApplications(postId, cursor, limit);
  }

  async createPost(
    payload: PostPayload,
    asDraft = false,
  ): Promise<PostResponse> {
    return toPost(
      await this.gateway.create(toCreatePostRequest(payload, asDraft)),
    );
  }

  async updatePost(
    postId: string,
    payload: PostPayload,
  ): Promise<PostResponse> {
    return toPost(
      await this.gateway.update(postId, toUpdatePostRequest(payload)),
    );
  }

  async publishPost(postId: string): Promise<PostResponse> {
    return toPost(await this.gateway.publish(postId));
  }

  closePost(postId: string): Promise<void> {
    return this.gateway.close(postId);
  }

  deletePost(postId: string): Promise<void> {
    return this.gateway.delete(postId);
  }

  removePostByAdmin(postId: string, reason?: string): Promise<void> {
    return this.gateway.removeByAdmin(postId, reason);
  }

  getStatistics(): Promise<PostStatistic[]> {
    return this.gateway.statisticsByStatus();
  }
}
