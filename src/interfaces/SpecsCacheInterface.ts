import { ConfigSpecs } from "../types/ConfigSpecs";

/**
 * Interface for specs cache.
 * Used for optimized retrieval of config specs.
 * Implement to replace default in-memory cache.
 */
export interface SpecsCacheInterface {
  /**
   * Returns specs stored for a given key.
   * @param key - Key of stored specs
   */
  get(key: string): Promise<ConfigSpecs>;
  /**
   * Updates specs for a given key.
   * @param key - Key of stored specs
   * @param specs - New specs to store
   */
  set(key: string, specs: ConfigSpecs): Promise<void>;
  /**
   * Clears specs for a given key.
   * @param key - Key of stored specs
   */
  clear(key: string): Promise<void>;
  /**
   * Clears all specs.
   */
  clearAll(): Promise<void>;
}
