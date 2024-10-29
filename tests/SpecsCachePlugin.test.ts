import StatsigStorageExample from "../examples/StatsigStorageExample";
import SpecsCache from "../src/SpecsCache";
import StatsigOnPrem from "../src/StatsigOnPrem";
import CacheUtils from "../src/utils/CacheUtils";
import HashUtils from "../src/utils/HashUtils";

describe("SpecsCachePlugin", () => {
  const storage = new StatsigStorageExample();
  const specsCache = new SpecsCache();
  const statsig = new StatsigOnPrem(storage, { specsCache });

  beforeAll(async () => {
    await statsig.initialize();
    await statsig.createGate("example-gate", {
      targetApps: ["targetApp1"],
      enabled: true,
    });
    await statsig.createConfig("example-config", {
      defaultValue: {},
      enabled: true,
    });
    await statsig.registerSDKKey("secret-key");
  });

  afterAll(async () => {
    storage.clearAll();
    await statsig.clearCache();
  });

  it("Cache config specs with default options", async () => {
    const specs = await statsig.getConfigSpecs("secret-key");
    expect(specs.dynamic_configs.length).toEqual(1);
    expect(specs.feature_gates.length).toEqual(1);
    expect(specs.hashed_sdk_keys_to_entities).toBeUndefined();

    const cached = await specsCache.get(
      "secret-key",
      CacheUtils.getCacheKey("secret-key")
    );
    expect(cached).toEqual(specs);
  });

  it("Cache config specs with SSR options", async () => {
    const options = { ssr: { targetApps: ["targetApp1"] } };
    const specs = await statsig.getConfigSpecs("secret-key", options);
    expect(specs.dynamic_configs.length).toEqual(1);
    expect(specs.feature_gates.length).toEqual(1);
    expect(specs.hashed_sdk_keys_to_entities).toEqual({
      [HashUtils.hashString("targetApp1")]: {
        gates: ["example-gate"],
        configs: [],
      },
    });

    const cached = await specsCache.get(
      "secret-key",
      CacheUtils.getCacheKey("secret-key", options)
    );
    expect(cached).toEqual(specs);
  });

  it("Clear cache for SDK key", async () => {
    await specsCache.clear("secret-key");
    const cachedDefault = await specsCache.get(
      "secret-key",
      CacheUtils.getCacheKey("secret-key")
    );
    const cachedSSR = await specsCache.get(
      "secret-key",
      CacheUtils.getCacheKey("secret-key", {
        ssr: { targetApps: ["targetApp1"] },
      })
    );
    expect(cachedDefault).toBeNull();
    expect(cachedSSR).toBeNull();
  });
});
