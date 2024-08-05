import StatsigStorageExample from "../examples/StatsigStorageExample";
import SDKKeysCache from "../src/SDKKeysCache";
import StatsigOnPrem from "../src/StatsigOnPrem";

describe("Hash plugin", () => {
  const storage = new StatsigStorageExample();
  const sdkKeysCache = new SDKKeysCache();
  const hashFn = (input: string) => `hashed:${input}`;
  const statsig = new StatsigOnPrem(storage, { sdkKeysCache, hash: hashFn });

  beforeAll(async () => {
    await statsig.initialize();
  });

  afterAll(async () => {
    storage.clearAll();
    await statsig.clearCache();
  });

  it("Uses custom hash function", async () => {
    await statsig.registerSDKKey("secret-123");
    expect(storage.get("statsig:sdkKey:hashed:secret-123")).resolves.toEqual(
      "registered"
    );
  });
});
