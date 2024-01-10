import { SpecsCacheInterface } from "./interfaces/SpecsCacheInterface";
import { ConfigSpecs } from "./types/ConfigSpecs";

export default class SpecsCache implements SpecsCacheInterface {
  private cache: Record<string, ConfigSpecs>;
  public constructor() {
    this.cache = {};
  }

  get(key: string): Promise<ConfigSpecs> {
    return Promise.resolve(this.cache[key]);
  }
  set(key: string, specs: ConfigSpecs): Promise<void> {
    this.cache[key] = specs;
    return Promise.resolve();
  }
  clear(key: string): Promise<void> {
    delete this.cache[key];
    return Promise.resolve();
  }
  clearAll(): Promise<void> {
    this.cache = {};
    return Promise.resolve();
  }
}
