import { ConfigSpecs } from "../types/ConfigSpecs";

/**
 * Interface for specs cache.
 * Used for optimized retrieval of config specs.
 * Implement to replace default in-memory cache.
 */
export interface SpecsCacheInterface {
  /**
   * Returns specs stored for a given key, or null if the cache has not been populated yet.
   * @param key - Primary key of stored specs
   * @param field - Secondary key of stored specs
   */
  get(key: string, field: string): Promise<ConfigSpecs | null>;
  /**
   * Updates specs for a given key.
   * @param key - Primary key of stored specs
   * @param field - Secondary key of stored specs
   * @param specs - New specs to store
   */
  set(key: string, field: string, specs: ConfigSpecs): Promise<void>;
  /**
   * Clears specs for a given key.
   * @param key - Primary key of stored specs
   */
  clear(key: string): Promise<void>;
  /**
   * Clears specs for a given key.
   * @param key - Primary key of stored specs
   * @param field - Secondary key of stored specs
   */
  clear(key: string, field: string): Promise<void>;
  /**
   * Clears all specs.
   */
  clearAll(): Promise<void>;
}
