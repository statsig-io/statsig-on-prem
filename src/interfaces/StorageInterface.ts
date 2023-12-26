/**
* An adapter for implementing custom storage of Statsig data
*/
export interface StorageInterface {
  /**
   * Returns the data stored for a given key
   * @param key - Key of stored item
   */
  get(key: string): Promise<string | null>;
  /**
   * Updates data stored for a given key
   * @param key - Key of stored item
   * @param value - New value to store
   */
  set(key: string, value: string): Promise<void>;
  /**
   * Deletes data for a given key
   * @param key - Key of stored item
   */
  delete(key: string): Promise<void>;
  /**
   * Startup tasks to run before any operations can be made
   */
  initialize(): Promise<void>;
  /**
   * Cleanup tasks
   */
  shutdown(): Promise<void>;
}
