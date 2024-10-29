import { SpecsCacheInterface } from "./interfaces/SpecsCacheInterface";
import { ConfigSpecs } from "./types/ConfigSpecs";

export default class SpecsCache implements SpecsCacheInterface {
  private cache: Record<string, Record<string, ConfigSpecs>>;
  public constructor() {
    this.cache = {};
  }

  get(key: string, field: string): Promise<ConfigSpecs | null> {
    if (!(key in this.cache)) {
      return Promise.resolve(null);
    }
    return Promise.resolve(this.cache[key][field] ?? null);
  }
  set(key: string, field: string, specs: ConfigSpecs): Promise<void> {
    if (!(key in this.cache)) {
      this.cache[key] = {};
    }
    this.cache[key][field] = specs;
    return Promise.resolve();
  }
  clear(key: string, field?: string): Promise<void> {
    if (field && key in this.cache) {
      delete this.cache[key][field];
    } else {
      delete this.cache[key];
    }
    return Promise.resolve();
  }
  clearAll(): Promise<void> {
    this.cache = {};
    return Promise.resolve();
  }
}
