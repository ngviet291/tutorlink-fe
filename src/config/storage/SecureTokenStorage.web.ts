import type { IKeyValueStorage, ITokenStorage } from "./types";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

/** localStorage không tồn tại khi SSR (expo export / static rendering). */
const getStorage = (): Storage | null =>
  typeof window !== "undefined" ? window.localStorage : null;

const webBackend: IKeyValueStorage = {
  get: async (key) => getStorage()?.getItem(key) ?? null,
  set: async (key, value) => {
    getStorage()?.setItem(key, value);
  },
  remove: async (key) => {
    getStorage()?.removeItem(key);
  },
};
export class SecureTokenStorage implements ITokenStorage {
  private readonly backend: IKeyValueStorage;

  constructor(backend: IKeyValueStorage = webBackend) {
    this.backend = backend;
  }

  saveAccessToken(token: string): Promise<void> {
    return this.backend.set(ACCESS_TOKEN_KEY, token);
  }

  getAccessToken(): Promise<string | null> {
    return this.backend.get(ACCESS_TOKEN_KEY);
  }

  saveRefreshToken(token: string): Promise<void> {
    return this.backend.set(REFRESH_TOKEN_KEY, token);
  }

  getRefreshToken(): Promise<string | null> {
    return this.backend.get(REFRESH_TOKEN_KEY);
  }

  async clear(): Promise<void> {
    await Promise.all([
      this.backend.remove(ACCESS_TOKEN_KEY),
      this.backend.remove(REFRESH_TOKEN_KEY),
    ]);
  }
}
