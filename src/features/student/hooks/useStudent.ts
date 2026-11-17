import { useQuery } from "@tanstack/react-query";
import { studentService } from "@/config/di/container";

export function useStudentProfile(id: string | undefined) {
  return useQuery({
    queryKey: ["students", "detail", id],
    queryFn: () => studentService.getStudentPublicProfile(id ?? ""),
    enabled: Boolean(id),
    retry: false,
  });
}
