import HashUtils from "./HashUtils";
import { GLOBAL_ASSOC_KEY } from "./StorageUtils";

export default class CacheUtils {
  public static getCacheKey(targetApp?: string | null) {
    return HashUtils.hashString(targetApp ?? GLOBAL_ASSOC_KEY);
  }
}
