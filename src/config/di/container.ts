import type { AuthGateway } from "@/features/auth/api/auth.gateway";
import { HttpAuthGateway } from "@/features/auth/api/http.auth.gateway";
import { AuthService } from "@/features/auth/service/auth.service";
import { createPublicClient } from "../http/publicClient";
import { createPrivateClient } from "../http/privateClient";
import { env } from "../env";
import { SecureTokenStorage } from "../storage/SecureTokenStorage.web";
import { AxiosHttpClient } from "../AxiosHttpClient";

// Toàn bộ bean được quản lí ở đây
export const tokenStorage = new SecureTokenStorage();

export const publicHttp = createPublicClient(env.apiBaseUrl);
export const privateHttp = createPrivateClient(env.apiBaseUrl, tokenStorage);

const publicHttpClient = new AxiosHttpClient(publicHttp);

const gateway: AuthGateway = new HttpAuthGateway(publicHttpClient);

export const authService = new AuthService(gateway, tokenStorage);
