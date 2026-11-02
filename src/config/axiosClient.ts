// Giữ lại để các service cũ (`import { http } from '@/config/axiosClient'`) không phải sửa.
// `http` = client PRIVATE (có token). Endpoint public dùng `publicHttp`.
export {
  privateHttp as http,
  privateHttp,
  publicHttp,
} from "@/config/di/container";
