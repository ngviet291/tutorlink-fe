import { useQuery } from "@tanstack/react-query";
import { addressGateway } from "@/config/di/container";

export const addressKeys = {
  all: ["address"] as const,
  provinces: () => [...addressKeys.all, "provinces"] as const,
  wards: (provinceCode: number | undefined) =>
    [...addressKeys.all, "wards", provinceCode] as const,
};

// Dữ liệu hành chính gần như không đổi: không bao giờ coi là cũ, không bị dọn khỏi bộ nhớ.
const STATIC_DATA = {
  staleTime: Infinity,
  gcTime: Infinity,
  retry: 1,
  refetchOnWindowFocus: false,
} as const;

export function useProvinces() {
  return useQuery({
    queryKey: addressKeys.provinces(),
    queryFn: () => addressGateway.getProvinces(),
    ...STATIC_DATA,
  });
}

/** Chưa chọn tỉnh (provinceCode = undefined) thì không gọi API. */
export function useWards(provinceCode: number | undefined) {
  return useQuery({
    queryKey: addressKeys.wards(provinceCode),
    queryFn: () => addressGateway.getWards(provinceCode as number),
    enabled: provinceCode !== undefined,
    ...STATIC_DATA,
  });
}
