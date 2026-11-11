import type { AuthGateway } from "@/features/auth/api/auth.gateway";
import { HttpAuthGateway } from "@/features/auth/api/http.auth.gateway";
import { AuthService } from "@/features/auth/service/auth.service";
import { createPublicClient } from "../http/publicClient";
import { createPrivateClient } from "../http/privateClient";
import { env } from "../env";
import { SecureTokenStorage } from "../storage/SecureTokenStorage.web";
import { AxiosHttpClient } from "../AxiosHttpClient";
import { HttpSubjectGateway } from "@/features/subject/api/http.subject.gateway";
import { SubjectService } from "@/features/subject/service/subject.service";
import { HttpChatGateway } from "@/features/chat/api/http.chat.gateway";
import { ChatService } from "@/features/chat/service/chat.service";
import { HttpAddressGateway } from "@/shared/api/http.address.gateway";
import { createTokenRefresher } from "../http/tokenRefresher";
import type { IRealtimeClient } from "../realtime/IRealtimeClient";
import { StompRealtimeClient } from "../realtime/StompRealtimeClient";
import { RealtimeEventRouter } from "../realtime/RealtimeEventRouter";

// Toàn bộ bean được quản lí ở đây
export const tokenStorage = new SecureTokenStorage();

export const publicHttp = createPublicClient(env.apiBaseUrl);
export const tokenRefresher = createTokenRefresher(env.apiBaseUrl, tokenStorage);
export const privateHttp = createPrivateClient(
  env.apiBaseUrl,
  tokenStorage,
  tokenRefresher,
);

// Realtime: token lấy mới (và refresh nếu sắp hết hạn) trước mỗi lần connect/reconnect
export const realtimeClient: IRealtimeClient = new StompRealtimeClient({
  url: env.wsUrl,
  getAccessToken: () => tokenRefresher.getValidAccessToken(),
});
export const realtimeRouter = new RealtimeEventRouter();

const publicHttpClient = new AxiosHttpClient(publicHttp);
const privateHttpClient = new AxiosHttpClient(privateHttp);

const gateway: AuthGateway = new HttpAuthGateway(publicHttpClient);
const subjectGateway = new HttpSubjectGateway(privateHttpClient); // client có gắn token, không phải client PUBLIC

export const subjectService = new SubjectService(subjectGateway);
export const addressGateway = new HttpAddressGateway(privateHttpClient);
export const authService = new AuthService(gateway, tokenStorage);
export const chatService = new ChatService(new HttpChatGateway(privateHttpClient));
