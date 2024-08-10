import StatsigStorageExample from "../examples/StatsigStorageExample";
import SDKKeysCache from "../src/SDKKeysCache";
import StatsigOnPrem from "../src/StatsigOnPrem";

describe("SDKKeysCachePlugin", () => {
  const storage = new StatsigStorageExample();
  const sdkKeysCache = new SDKKeysCache();
  const statsig = new StatsigOnPrem(storage, { sdkKeysCache });

  beforeAll(async () => {
    await statsig.initialize();
  });

  afterAll(async () => {
    storage.clearAll();
    await statsig.clearCache();
  });

  it("Register SDK Key", async () => {
    await statsig.registerSDKKey("secret-123");
    const cachedKeys = await sdkKeysCache.get();
    expect(cachedKeys).not.toBeNull();
    expect(cachedKeys?.has("secret-123")).toEqual(true);
  });

  it("Deactivate SDK Key", async () => {
    await statsig.deactivateSDKKey("secret-123");
    const cachedKeys = await sdkKeysCache.get();
    expect(cachedKeys).not.toBeNull();
    expect(cachedKeys?.has("secret-123")).toEqual(false);
  });

  it("Clear Cache", async () => {
    await statsig.registerSDKKey("secret-123");
    await statsig.clearCache();
    const cachedKeys = await sdkKeysCache.get();
    expect(cachedKeys).toBeNull();
  });

  it("Re-populates from the store", async () => {
    await statsig.registerSDKKey("secret-123");
    await sdkKeysCache.clear();
    const registeredKeys = await statsig.getRegisteredSDKKeys();
    expect(registeredKeys.has("secret-123")).toEqual(true);
    
    const cachedKeys = await sdkKeysCache.get();
    expect(cachedKeys).not.toBeNull();
    expect(cachedKeys?.has("secret-123")).toEqual(true);
  });
});
