import type { CursorResponse } from "@/shared/types/api.types";
import type {
  ApplicationResponse,
  CreateApplicationRequest,
  RankedApplicationsResponse,
} from "../types/application.dto";
import type { BaseUserResponse } from "@/features/user/types/user.dto";

export interface ApplicationGateway {
  apply(req: CreateApplicationRequest): Promise<ApplicationResponse>;
  getById(id: string): Promise<ApplicationResponse>;
  listMine(limit?: number): Promise<CursorResponse<ApplicationResponse>>;
  listByPost(
    postId: string,
    limit?: number,
  ): Promise<CursorResponse<ApplicationResponse>>;
  ranked(postId: string): Promise<RankedApplicationsResponse>;
  select(id: string): Promise<ApplicationResponse>;
  unselect(id: string): Promise<ApplicationResponse>;
  reject(id: string): Promise<ApplicationResponse>;
  confirm(id: string): Promise<ApplicationResponse>;
  finish(id: string): Promise<ApplicationResponse>;
  cancel(id: string): Promise<ApplicationResponse>;
  pay(id: string): Promise<void>;
  getPublicUser(userId: string): Promise<BaseUserResponse>;
}
