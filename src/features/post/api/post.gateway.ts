import type { CursorResponse } from "@/shared/types/api.types";
import type {
  CreatePostRequest,
  PostApplicationResponse,
  PostResponse,
  PostStatisticsByStatus,
  UpdatePostRequest,
} from "../types/post.dto";
import type {
  AdminPostFilter,
  MyPostFilter,
  PostFilter,
} from "../types/post.types";

export interface PostGateway {
  create(req: CreatePostRequest): Promise<PostResponse>;
  getById(postId: string): Promise<PostResponse>;
  getByIdForMe(postId: string): Promise<PostResponse>;
  list(filter: PostFilter): Promise<CursorResponse<PostResponse>>;
  listAdmin(filter: AdminPostFilter): Promise<CursorResponse<PostResponse>>;
  listMine(filter: MyPostFilter): Promise<CursorResponse<PostResponse>>;
  listApplications(
    postId: string,
    cursor?: string,
    limit?: number,
  ): Promise<CursorResponse<PostApplicationResponse>>;
  update(postId: string, req: UpdatePostRequest): Promise<PostResponse>;
  publish(postId: string): Promise<PostResponse>;
  close(postId: string): Promise<void>;
  delete(postId: string): Promise<void>;
  removeByAdmin(postId: string, reason?: string): Promise<void>;
  statisticsByStatus(): Promise<PostStatisticsByStatus[]>;
  getByIdForAdmin(postId: string): Promise<PostResponse>;
}
