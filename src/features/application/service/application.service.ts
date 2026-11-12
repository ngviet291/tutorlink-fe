import type {
  ApplicationResponse,
  AiSuggestionResponse,
  ApplyPayload,
  PostApplicationItem,
  AiRankedApplication,
} from "../types/application.types";
import type {
  ApplicationResponse as ApplicationDto,
  ScoredApplicationResponse,
  UserSummary,
} from "../types/application.dto";
import type { BaseUserResponse } from "@/features/user/types/user.dto";
import type { PostResponse } from "@/features/post/types/post.types";
import type { ApplicationGateway } from "../api/application.gateway";
import type { PostService } from "@/features/post/service/post.service";
import type { TutorResponse } from "@/features/tutor/types/tutor.types";
import type { StudentResponse } from "@/features/user/types/user.types";
import { describeWarnings } from "../util/matchwarning";

/** BE chỉ trả id/fullName/avatarUrl; các field còn lại của public-profile để trống. */
function fromSummary(u: UserSummary): BaseUserResponse {
  return {
    id: u.id,
    fullName: u.fullName,
    avatarUrl: u.avatarUrl,
  } as BaseUserResponse;
}

function asStudent(user: BaseUserResponse): StudentResponse {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    gender: user.gender,
    dateOfBirth: user.dateOfBirth,
    address: user.address,
    userStatus: user.userStatus,
    role: user.role as StudentResponse["role"],
    grade: undefined,
    learningGoal: undefined,
  };
}

function asTutor(user: BaseUserResponse): TutorResponse {
  return {
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    experienceYears: 0,
    hourlyRate: 0,
    averageRating: 0,
    verificationStatus: "PENDING",
    address: user.address,
  };
}

export class ApplicationService {
  private readonly gateway: ApplicationGateway;
  private readonly postService: PostService;

  /** Cache public-profile dùng chung giữa các lần gọi (mine, by-post, ranked). */
  private readonly userCache = new Map<
    string,
    { at: number; promise: Promise<BaseUserResponse> }
  >();
  private static readonly USER_TTL_MS = 5 * 60 * 1000;

  private loadUser(id: string): Promise<BaseUserResponse> {
    const hit = this.userCache.get(id);
    if (hit && Date.now() - hit.at < ApplicationService.USER_TTL_MS) {
      return hit.promise;
    }
    const promise = this.gateway.getPublicUser(id);
    this.userCache.set(id, { at: Date.now(), promise });
    // Lỗi thì bỏ khỏi cache để lần sau gọi lại.
    promise.catch(() => this.userCache.delete(id));
    return promise;
  }

  constructor(gateway: ApplicationGateway, postService: PostService) {
    this.gateway = gateway;
    this.postService = postService;
  }

  /**
   * BE ApplicationResponse chỉ có ID liên kết; UI cần object post/tutor/student nên ghép tại đây.
   * Đơn có bài không đọc được (đã gỡ/xóa/không công khai) bị bỏ qua, không làm hỏng cả danh sách.
   */
  private async enrichMany(
    items: ApplicationDto[],
    knownPost?: PostResponse,
  ): Promise<ApplicationResponse[]> {
    const postCache = new Map<string, Promise<PostResponse | null>>();
    if (knownPost) postCache.set(knownPost.id, Promise.resolve(knownPost));

    const loadPost = (id: string) => {
      if (!postCache.has(id)) {
        postCache.set(
          id,
          this.postService
            .getPostById(id)
            .catch(() => this.postService.getPostByIdForMe(id))
            .catch(() => null),
        );
      }
      return postCache.get(id)!;
    };
    const result = await Promise.all(
      items.map(async (dto): Promise<ApplicationResponse | null> => {
        const post = await loadPost(dto.postId);
        if (!post) return null;
        return this.build(dto, post);
      }),
    );
    return result.filter((r): r is ApplicationResponse => r !== null);
  }

  private build(dto: ApplicationDto, post: PostResponse): ApplicationResponse {
    return {
      id: dto.id,
      post,
      student: asStudent(fromSummary(dto.student)),
      tutor: asTutor(fromSummary(dto.tutor)),
      applicationStatus: dto.applicationStatus,
      message: dto.message,
      proposedFee: dto.proposedFee,
      appliedAt: dto.appliedAt,
      processedByAdminId: dto.processedByAdminId,
      transactionId: dto.transactionId,
    };
  }

  /**
   * Dùng sau thao tác (select/confirm/finish/cancel/apply). Thao tác đã thành công ở BE,
   * nên nếu không đọc được bài (vd vừa chuyển sang CLOSED) thì trả bản rút gọn, không ném lỗi.
   */
  private async enrich(dto: ApplicationDto): Promise<ApplicationResponse> {
    const [app] = await this.enrichMany([dto]);
    return app ?? this.build(dto, { id: dto.postId } as PostResponse);
  }

  private async enrichPostApplicants(
    postId: string,
    items: PostApplicationItem[],
  ): Promise<ApplicationResponse[]> {
    const post = await this.postService.getPostById(postId);
    const postOwner = await this.loadUser(post.author.id);

    return Promise.all(
      items.map(async (item) => {
        const applicant = await this.loadUser(item.userId);
        const isTutorApplicant = post.type === "FIND_TUTOR";

        return {
          id: item.applicationId,
          post,
          tutor: isTutorApplicant ? asTutor(applicant) : asTutor(postOwner),
          student: isTutorApplicant
            ? asStudent(postOwner)
            : asStudent(applicant),
          applicationStatus: item.status,
          appliedAt: item.appliedAt,
        };
      }),
    );
  }

  // Arrow property: truyền thẳng làm queryFn/mutationFn không mất `this`.

  applyToPost = async (payload: ApplyPayload): Promise<ApplicationResponse> =>
    this.enrich(await this.gateway.apply(payload));

  /** GET /v1/applications/mine */
  getMyApplications = async (): Promise<ApplicationResponse[]> => {
    const page = await this.gateway.listMine(100);
    return this.enrichMany(page.content);
  };

  /**
   * GET /v1/applications/mine, chỉ lấy đơn của bài đang xem.
   * Dùng luôn object post đã tải ở trang, không gọi lại /v1/posts/{id}
   * (bài CLOSED bị endpoint công khai trả 404).
   */
  getMyApplicationsForPost = async (
    post: PostResponse,
  ): Promise<ApplicationResponse[]> => {
    const page = await this.gateway.listMine(100);
    return this.enrichMany(
      page.content.filter((a) => a.postId === post.id),
      post,
    );
  };

  getConnections = async (): Promise<ApplicationResponse[]> => {
    const mine = await this.getMyApplications();
    return mine.filter(
      (a) =>
        a.applicationStatus === "PAID" || a.applicationStatus === "FINISHED",
    );
  };

  /** BE trả PostApplicationResponse, không phải ApplicationResponse. */
  getApplicationsByPost = async (
    postId: string,
  ): Promise<ApplicationResponse[]> => {
    const page = await this.gateway.listByPost(postId, 100);
    return this.enrichPostApplicants(postId, page.content);
  };

  /** GET /v1/applications/post/{postId}/ranked: chỉ lấy top 5 khi BE đã chấm điểm. */
  getAiTop5 = async (postId: string): Promise<AiSuggestionResponse> => {
    const res = await this.gateway.ranked(postId);
    if (!res.ranked) return { items: [], source: "AI", ranked: false };

    const scored = (res.top ?? []).filter(
      (
        item,
      ): item is ScoredApplicationResponse & {
        application: ApplicationDto;
      } => Boolean(item.application),
    );

    const apps = await this.enrichMany(scored.map((i) => i.application));
    const byId = new Map(apps.map((a) => [a.id, a]));

    // Giữ thứ tự điểm của BE; đơn bị bỏ qua ở enrichMany thì không có trong byId.
    const items: AiRankedApplication[] = scored.flatMap((s) => {
      const app = byId.get(s.application.id);
      if (!app) return [];
      return [
        {
          ...app,
          aiRank: 0,
          aiScore: s.score,
          aiReason: describeWarnings(s.warnings),
        },
      ];
    });
    items.forEach((it, i) => (it.aiRank = i + 1));

    return { items, source: "AI", ranked: true };
  };

  selectApplicant = async (id: string): Promise<ApplicationResponse> =>
    this.enrich(await this.gateway.select(id));

  /** POST /v1/payments/applications/{id}/pay rồi đọc lại đơn. */
  confirmAndPayFee = async (id: string): Promise<ApplicationResponse> => {
    await this.gateway.pay(id);
    return this.enrich(await this.gateway.getById(id));
  };

  confirmApplication = async (id: string): Promise<ApplicationResponse> =>
    this.enrich(await this.gateway.confirm(id));

  finishApplication = async (id: string): Promise<ApplicationResponse> =>
    this.enrich(await this.gateway.finish(id));

  declineOffer = async (id: string): Promise<ApplicationResponse> =>
    this.enrich(await this.gateway.cancel(id));

  cancelApplication = async (id: string): Promise<ApplicationResponse> =>
    this.enrich(await this.gateway.cancel(id));
}
