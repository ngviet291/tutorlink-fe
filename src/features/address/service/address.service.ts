import axios from "axios";

import type { Province, Ward } from "../types/address.types";

const BASE_URL =
  import.meta.env.APP_ADDRESS_PROVINCES_API_BASE_URL ||
  "https://provinces.open-api.vn";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

export const addressService = {
  async getProvinces(): Promise<Province[]> {
    const { data } = await client.get<Province[]>("/api/v2/p/");

    return data;
  },

  async getWards(provinceCode: number): Promise<Ward[]> {
    const { data } = await client.get<Ward[]>("/api/v2/w/", {
      params: {
        province: provinceCode,
      },
    });

    return data;
  },
};
