import { useQuery } from "@tanstack/react-query";
import { publicHttp } from "@/config/axiosClient";
import { mockConfig } from "@/config/env";
import { users } from "@/mocks/db";
import { delay } from "@/mocks/session";
import { ApiError } from "@/shared/types/api.types";
import type { StudentResponse } from "@/features/user/types/user.dto";

async function getStudentPublicProfile(id: string): Promise<StudentResponse> {
  if (mockConfig.user) {
    await delay(200);
    const u = users.find((x) => x.id === id && x.role === "STUDENT");
    if (!u) throw new ApiError("Không tìm thấy học viên", "NOT_FOUND", 404);
    return { ...u, role: u.role, userStatus: u.userStatus } as StudentResponse;
  }
  const res = await publicHttp.get<StudentResponse>(
    `/v1/users/${id}/public-profile`,
  );
  if (String(res.data.role).replace(/^ROLE_/i, "") !== "STUDENT") {
    throw new ApiError("Không tìm thấy học viên", "NOT_FOUND", 404);
  }
  return res.data;
}

export function useStudentProfile(id: string | undefined) {
  return useQuery({
    queryKey: ["students", "detail", id],
    queryFn: () => getStudentPublicProfile(id ?? ""),
    enabled: Boolean(id),
    retry: false,
  });
}
