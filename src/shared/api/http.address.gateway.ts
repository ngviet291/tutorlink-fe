import type { IHttpClient } from "@/config/http/IHttpClient";
import type { Province, Ward } from "../types/common.dto";

const ADDRESSES = "/v1/addresses";

export interface AddressGateway {
  getProvinces(): Promise<Province[]>;
  getWards(provinceCode: number): Promise<Ward[]>;
}

/**
 * Gọi BE (BE tự gọi provinces.open-api.vn và cache 24h).
 * Hai endpoint này public nên truyền client PUBLIC, giống /v1/auth.
 */
export class HttpAddressGateway implements AddressGateway {
  private readonly http: IHttpClient;

  constructor(http: IHttpClient) {
    this.http = http;
  }

  getProvinces(): Promise<Province[]> {
    return this.http.get<Province[]>(`${ADDRESSES}/provinces`);
  }

  getWards(provinceCode: number): Promise<Ward[]> {
    return this.http.get<Ward[]>(
      `${ADDRESSES}/provinces/${provinceCode}/wards`,
    );
  }
}
