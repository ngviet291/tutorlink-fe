import type { BankGateway } from "../api/bank.gateway";

/** Điều phối việc lấy danh sách ngân hàng qua gateway, độc lập với HTTP. */
export class BankService {
  private readonly gateway: BankGateway;

  constructor(gateway: BankGateway) {
    this.gateway = gateway;
  }

  getBanks() {
    return this.gateway.getBanks();
  }
}
