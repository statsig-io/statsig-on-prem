import { StorageInterface } from "../src/interfaces/StorageInterface";

export default class StatsigStorageExample implements StorageInterface {
  private store: Record<string, string>;
  public constructor() {
    this.store = {};
  }
  async get(key: string): Promise<string | null> {
    return this.store[key] ?? null;
  }
  async set(key: string, value: string): Promise<void> {
    this.store[key] = value;
  }
  async delete(key: string): Promise<void> {
    delete this.store[key];
  }
  async initialize(): Promise<void> {/* no-op */}
  async shutdown(): Promise<void> {/* no-op */}
}
