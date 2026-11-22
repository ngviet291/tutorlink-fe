/** Ngân hàng hiển thị trong form; BE: payment/dto/response/BankResponse.java */
export interface Bank {
  code: string;
  bin: string;
  name: string;
  shortName: string;
  logo: string;
  transferSupported: boolean;
  lookupSupported: boolean;
}
