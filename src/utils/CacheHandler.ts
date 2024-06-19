import { SpecsCacheInterface } from "../interfaces/SpecsCacheInterface";
import { ConfigSpecs } from "../types/ConfigSpecs";
import CacheUtils from "./CacheUtils";

export default class CacheHandler {
  public constructor(private cache: SpecsCacheInterface) {}

  public async cacheSpecs(sdkKey: string, specs: ConfigSpecs): Promise<void> {
    const cacheKey = CacheUtils.getCacheKey(sdkKey);
    await this.cache.set(cacheKey, specs);
  }

  public async getSpecs(sdkKey: string): Promise<ConfigSpecs> {
    const cacheKey = CacheUtils.getCacheKey(sdkKey);
    return await this.cache.get(cacheKey);
  }

  public async clear(...sdkKeys: string[]) {
    await Promise.all(
      sdkKeys.map((sdkKey) => {
        const cacheKey = CacheUtils.getCacheKey(sdkKey);
        return this.cache.clear(cacheKey);
      })
    );
  }

  public async clearAll(): Promise<void> {
    await this.cache.clearAll();
  }
}
