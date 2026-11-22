import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { bankService } from "@/config/di/container";

const BANKS_STALE_TIME_MS = 24 * 60 * 60 * 1000;

/** Danh sách ngân hàng ít thay đổi nên giữ cache lâu, không gọi lại mỗi lần mở form. */
export function useBanks(enabled = true) {
  return useQuery({
    queryKey: queryKeys.banks.all,
    queryFn: () => bankService.getBanks(),
    staleTime: BANKS_STALE_TIME_MS,
    enabled,
  });
}
