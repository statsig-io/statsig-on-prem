import HashUtils from "./HashUtils";

export default class CacheUtils {
  public static getCacheKey(sdkKey: string) {
    return HashUtils.hashString(sdkKey);
  }
}
