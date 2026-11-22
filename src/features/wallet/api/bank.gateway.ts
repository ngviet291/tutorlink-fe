import type { Bank } from "../types/bank.types";

/** Hợp đồng lấy danh sách ngân hàng; tách khỏi WalletGateway để mỗi lớp chỉ làm một việc. */
export interface BankGateway {
  getBanks(): Promise<Bank[]>;
}
