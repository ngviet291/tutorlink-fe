import type { WalletGateway } from "../api/wallet.gateway";
import type { TopUpPayload, TransactionFilter, WithdrawalBankDetails } from "../types/wallet.types";

/** Điều phối thao tác ví qua hợp đồng gateway, độc lập với HTTP. */
export class WalletService {
  updateWithdrawal(id: string, details: WithdrawalBankDetails) {
    return this.gateway.updateWithdrawal(id, details);
  }
  private readonly gateway: WalletGateway;

  constructor(gateway: WalletGateway) {
    this.gateway = gateway;
  }

  confirmDemoTopUp(id: string) {
    return this.gateway.confirmDemoTopUp(id);
  }

  getWallet() {
    return this.gateway.getWallet();
  }

  topUp(payload: TopUpPayload) {
    return this.gateway.topUp(payload);
  }

  getTransaction(id: string) {
    return this.gateway.getTransaction(id);
  }

  getTopUpStatus(id: string) {
    return this.gateway.getTopUpStatus(id);
  }

  confirmTopUp(id: string) {
    return this.getTopUpStatus(id);
  }

  getTransactions(params: TransactionFilter = {}) {
    return this.gateway.getTransactions(params);
  }

  getFeeQuote(applicationId: string) {
    return this.gateway.getFeeQuote(applicationId);
  }

  payCommission(applicationId: string) {
    return this.gateway.payCommission(applicationId);
  }

  withdraw(payload: { 
    amount: number; 
    bankAccountNumber: string; 
    bankName: string; 
    accountHolderName: string 
  }) {
    return this.gateway.withdraw(payload);
  }
}
