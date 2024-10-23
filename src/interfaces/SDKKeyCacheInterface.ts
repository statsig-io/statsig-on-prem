/**
 * Interface for SDK key cache.
 * Used for optimized retrieval of registered SDK keys.
 * Implement to replace default in-memory cache.
 */
export interface SDKKeysCacheInterface {
  /**
   * Returns SDK keys, or null if the cache has not been populated yet.
   */
  get(): Promise<Set<string> | null>;
  /**
   * Updates SDK keys.
   * @param keys - Set of SDK keys to store
   */
  set(keys: Set<string>): Promise<void>;
  /**
   * Clears cached SDK keys.
   */
  clear(): Promise<void>;
  /**
   * Returns global SDK keys (no target app assignment), or null if the cache has not been populated yet.
   */
  getGlobal(): Promise<Set<string> | null>;
  /**
   * Updates global SDK keys.
   * @param keys - Set of SDK keys to store
   */
  setGlobal(keys: Set<string>): Promise<void>;
  /**
   * Clears cached global SDK keys.
   */
  clearGlobal(): Promise<void>;
}
