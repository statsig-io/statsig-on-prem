import { SDKKeysCacheInterface } from "./interfaces/SDKKeyCacheInterface";

export default class SDKKeysCache implements SDKKeysCacheInterface {
  private cache: Set<string>;
  public constructor() {
    this.cache = new Set();
  }

  get(): Promise<Set<string>> {
    return Promise.resolve(this.cache);
  }
  set(keys: Set<string>): Promise<void> {
    this.cache = keys;
    return Promise.resolve();
  }
  clear(): Promise<void> {
    this.cache.clear();
    return Promise.resolve();
  }
}
