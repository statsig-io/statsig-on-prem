/**
 * Interface for SDK key cache.
 * Used for optimized retrieval of registered SDK keys.
 * Implement to replace default in-memory cache.
 */
export interface SDKKeysCacheInterface {
  /**
   * Returns SDK keys.
   */
  get(): Promise<Set<string>>;
  /**
   * Updates SDK keys.
   * @param keys - Set of SDK keys to store
   */
  set(keys: Set<string>): Promise<void>;
  /**
   * Clears cached SDK keys.
   */
   clear(): Promise<void>;
}
