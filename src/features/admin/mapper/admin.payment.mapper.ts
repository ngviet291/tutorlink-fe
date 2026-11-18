import { PERCENT_SCALE } from "@/features/wallet/constants/payment.constants";
import type {
  CreateFeeConfigRequest,
  FeeConfigResponse,
} from "@/features/wallet/types/payment.dto";
import type { FeeRateConfig, FeeRatePayload } from "../types/admin.types";

export function mapFeeConfig(
  dto: FeeConfigResponse,
  today = new Date().toLocaleDateString("en-CA"),
): FeeRateConfig {
  return {
    id: dto.id,
    rate: Number(dto.feePercentage),
    fixedFee: Number(dto.fixedFee),
    effectiveFrom: dto.effectiveFrom,
    effectiveTo: dto.effectiveTo,
    createdBy: dto.createdByAdminId ?? "—",
    createdByName: dto.createdByAdminName,
    active: dto.effectiveFrom <= today && (!dto.effectiveTo || dto.effectiveTo >= today),
  };
}

export function toFeeConfigRequest(payload: FeeRatePayload): CreateFeeConfigRequest {
  return {
    feePercentage: payload.ratePercent / PERCENT_SCALE,
    fixedFee: payload.fixedFee ?? 0,
    effectiveFrom: payload.effectiveFrom,
  };
}
