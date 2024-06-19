import StatsigStorageExample from "../examples/StatsigStorageExample";
import StatsigOnPrem from "../src/StatsigOnPrem";
import StatsigSDK from "statsig-node";

describe("Migrating from 0.0.7-beta to 0.0.8-beta", () => {
  const storage = new StatsigStorageExample();
  const statsig = new StatsigOnPrem(storage);

  beforeAll(async () => {
    await statsig.initialize();
  });

  afterEach(async () => {
    storage.clearAll();
    await statsig.clearCache();
  });

  it("Target app 2 way assocs", async () => {
    await statsig.createGate("test-gate", { enabled: true });
    await statsig.createTargetApp("target-app-1", {
      gates: new Set(["test-gate"]),
      configs: new Set([]),
      experiments: new Set([]),
    });
    storage.set(
      "statsig:gate:3068278054",
      '{"name":"test-gate","salt":"ba4ca158-f48d-44a2-a25c-a7777ad73e71","idType":"userID","enabled":true}'
    );
    let gate = await statsig.getGate("test-gate");
    expect(gate?.targetApps).toEqual(undefined);

    await statsig.updateAll__V0_0_8_BETA();
    gate = await statsig.getGate("test-gate");
    expect(gate?.targetApps).toEqual(new Set(["target-app-1"]));
  });

  it("Serialization", async () => {
    await statsig.createGate("test-gate", { enabled: true });
    await statsig.createConfig("test-config", {
      defaultValue: {},
      enabled: true,
    });
    await statsig.createExperiment("test-experiment", {
      defaultValue: {},
      enabled: true,
      groups: [],
      started: false,
    });
    await statsig.registerSDKKey("secret-key");
    await statsig.createTargetApp("target-app-1", {
      gates: new Set(["test-gate"]),
      configs: new Set(["test-config"]),
      experiments: new Set(["test-experiment"]),
    });
    await statsig.assignTargetAppsToSDKKey(["target-app-1"], "secret-key");

    // Reset storage back to old serialization
    await storage.set("statsig:sdkKeys", '["secret-key"]'); // SDK_KEYS
    await storage.set("statsig:targetApps", '["target-app-1"]'); // TARGET_APPS
    await storage.set(
      "statsig:entities:2648887369",
      '{"gates":["test-gate"],"configs":["test-config"],"experiments":["test-experiment"]}'
    ); // TARGET_APP_TO_ENTITY_NAMES
    await storage.set("statsig:2648887369:sdkKeys", '["secret-key"]'); // TARGET_APP_TO_SDK_KEYS
    await storage.set("statsig:2842331586:targetApps", '["target-app-1"]'); // SDK_KEY_TO_TARGET_APPS

    await statsig.updateAll__V0_0_8_BETA();

    expect(await storage.get("statsig:sdkKeys")).toEqual(
      '{"dataType":"Set","value":["secret-key"]}'
    );
    expect(await storage.get("statsig:targetApps")).toEqual(
      '{"dataType":"Set","value":["target-app-1"]}'
    );
    expect(await storage.get("statsig:entities:2648887369")).toEqual(
      '{"gates":{"dataType":"Set","value":["test-gate"]},"configs":{"dataType":"Set","value":["test-config"]},"experiments":{"dataType":"Set","value":{"dataType":"Set","value":["test-experiment"]}}}'
    );
    expect(await storage.get("statsig:2648887369:sdkKeys")).toEqual(
      '{"dataType":"Set","value":["secret-key"]}'
    );
    expect(await storage.get("statsig:2842331586:targetApps")).toEqual(
      '{"dataType":"Set","value":["target-app-1"]}'
    );

    // Verify that E2E still works
    const configSpecs = await statsig.getConfigSpecs("secret-key");
    await StatsigSDK.initialize("secret-key", {
      bootstrapValues: JSON.stringify(configSpecs),
    });
    expect(StatsigSDK.checkGateSync({ userID: "123" }, "test-gate")).toEqual(
      true
    );
  });
});
