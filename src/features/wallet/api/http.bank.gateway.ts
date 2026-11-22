import type { IHttpClient } from "@/config/http/IHttpClient";
import type { Bank } from "../types/bank.types";
import type { BankGateway } from "./bank.gateway";

const BANKS_API_PATH = "/v1/banks";

/** Chỉ lớp này biết đường dẫn API danh sách ngân hàng. */
export class HttpBankGateway implements BankGateway {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
  }

  async getBanks(): Promise<Bank[]> {
    return this.http.get<Bank[]>(BANKS_API_PATH);
  }
}
