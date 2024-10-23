import { SDKKeysCacheInterface } from "./interfaces/SDKKeyCacheInterface";

export default class SDKKeysCache implements SDKKeysCacheInterface {
  private cache: {
    allKeys: Set<string> | null;
    globalKeys: Set<string> | null;
  };
  public constructor() {
    this.cache = { allKeys: null, globalKeys: null };
  }

  get(): Promise<Set<string> | null> {
    return Promise.resolve(this.cache.allKeys);
  }
  set(keys: Set<string>): Promise<void> {
    this.cache.allKeys = keys;
    return Promise.resolve();
  }
  clear(): Promise<void> {
    this.cache.allKeys = null;
    return Promise.resolve();
  }
  getGlobal(): Promise<Set<string> | null> {
    return Promise.resolve(this.cache.globalKeys);
  }
  setGlobal(keys: Set<string>): Promise<void> {
    this.cache.globalKeys = keys;
    return Promise.resolve();
  }
  clearGlobal(): Promise<void> {
    this.cache.globalKeys = null;
    return Promise.resolve();
  }
}
