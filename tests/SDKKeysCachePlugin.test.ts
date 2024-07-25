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
    expect(cachedKeys.has("secret-123")).toEqual(true);
  });

  it("Deactivate SDK Key", async () => {
    await statsig.deactivateSDKKey("secret-123");
    const cachedKeys = await sdkKeysCache.get();
    expect(cachedKeys.has("secret-123")).toEqual(false);
  });

  it("Clear Cache", async () => {
    await statsig.registerSDKKey("secret-123");
    await statsig.clearCache();
    const cachedKeys = await sdkKeysCache.get();
    expect(cachedKeys.has("secret-123")).toEqual(false);
  });
});
