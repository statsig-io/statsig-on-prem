import { ConfigSpecsOptions } from "./ConfigSpecsUtils";
import HashUtils from "./HashUtils";

export default class CacheUtils {
  public static getCacheKey(sdkKey: string, options?: ConfigSpecsOptions) {
    let cacheKey = sdkKey;
    if (options?.ssr) {
      cacheKey = `{sdk_key:${sdkKey}}`;
      const { clientKeys, targetApps } = options?.ssr;
      if (clientKeys) {
        cacheKey = `${cacheKey}:{${
          clientKeys === "all"
            ? "client_keys:all"
            : `client_keys:${clientKeys.join()}`
        }}`;
      }
      if (targetApps) {
        cacheKey = `${cacheKey}:{${
          targetApps === "all"
            ? "target_apps:all"
            : `target_apps:${targetApps.join()}`
        }}`;
      }
    }
    return HashUtils.hashString(cacheKey);
  }
}
