import { SDKKeysCacheInterface } from "../interfaces/SDKKeyCacheInterface";
import { SpecsCacheInterface } from "../interfaces/SpecsCacheInterface";
import SDKKeysCache from "../SDKKeysCache";
import SpecsCache from "../SpecsCache";
import { ConfigSpecs } from "../types/ConfigSpecs";
import CacheUtils from "./CacheUtils";
import { ConfigSpecsOptions } from "./ConfigSpecsUtils";

type CacheLibrary = { specs: SpecsCacheInterface; keys: SDKKeysCacheInterface };

export default class CacheHandler {
  private cache: CacheLibrary;
  public constructor(cache: Partial<CacheLibrary>) {
    this.cache = {
      specs: cache.specs ?? new SpecsCache(),
      keys: cache.keys ?? new SDKKeysCache(),
    };
  }

  public async cacheSpecs(
    sdkKey: string,
    options: ConfigSpecsOptions | undefined,
    specs: ConfigSpecs
  ): Promise<void> {
    const cacheKey = CacheUtils.getCacheKey(sdkKey, options);
    await this.cache.specs.set(cacheKey, specs);
  }

  public async getSpecs(
    sdkKey: string,
    options: ConfigSpecsOptions | undefined
  ): Promise<ConfigSpecs | null> {
    const cacheKey = CacheUtils.getCacheKey(sdkKey, options);
    return await this.cache.specs.get(cacheKey);
  }

  public async clearSpecs(...sdkKeys: string[]) {
    if (sdkKeys.length > 0) {
      await Promise.all(
        sdkKeys.map((sdkKey) => {
          const cacheKey = CacheUtils.getCacheKey(sdkKey);
          return this.cache.specs.clear(cacheKey);
        })
      );
    } else {
      await this.cache.specs.clearAll();
    }
  }

  public async cacheSDKKeys(sdkKeys: Set<string>): Promise<void> {
    return await this.cache.keys.set(sdkKeys);
  }

  public async getSDKKeys(): Promise<Set<string> | null> {
    return await this.cache.keys.get();
  }

  public async clearSDKKeys(): Promise<void> {
    await this.cache.keys.clear();
  }

  public async clearAll(): Promise<void> {
    await this.cache.specs.clearAll();
    await this.cache.keys.clear();
  }
}
