import { SDKKeysCacheInterface } from "./interfaces/SDKKeyCacheInterface";

export default class SDKKeysCache implements SDKKeysCacheInterface {
  private cache: Set<string> | null;
  public constructor() {
    this.cache = null;
  }

  get(): Promise<Set<string> | null> {
    return Promise.resolve(this.cache);
  }
  set(keys: Set<string>): Promise<void> {
    this.cache = keys;
    return Promise.resolve();
  }
  clear(): Promise<void> {
    this.cache = null;
    return Promise.resolve();
  }
}
