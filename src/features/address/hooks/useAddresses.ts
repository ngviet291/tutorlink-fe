import { useQuery } from "@tanstack/react-query";

import { addressService } from "../service/address.service";

export function useProvinces() {
  return useQuery({
    queryKey: ["address", "provinces"],
    queryFn: addressService.getProvinces,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 2,
  });
}

export function useWards(provinceCode?: number) {
  return useQuery({
    queryKey: ["address", "wards", provinceCode],
    queryFn: () => addressService.getWards(provinceCode!),
    enabled: provinceCode !== undefined,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 2,
  });
}
