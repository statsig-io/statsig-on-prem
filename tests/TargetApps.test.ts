import StatsigStorageExample from "../examples/StatsigStorageExample";
import StatsigOnPrem from "../src/StatsigOnPrem";
import HashUtils from "../src/utils/HashUtils";

describe("Target Apps", () => {
  const storage = new StatsigStorageExample();
  const statsig = new StatsigOnPrem(storage);

  beforeAll(async () => {
    await statsig.initialize();
  });

  afterEach(async () => {
    storage.clearAll();
    await statsig.clearCache();
  });

  it("Intialize with target app", async () => {
    await statsig.createGate("gate_1", {
      enabled: true,
      targetApps: ["serverApp1"],
    });
    await statsig.createGate("gate_2", {
      enabled: true,
      targetApps: ["serverApp2"],
    });
    await statsig.createGate("gate_3", {
      enabled: true,
    });
    await statsig.registerSDKKey("server-key");
    await statsig.assignTargetAppsToSDKKey(
      ["serverApp1", "serverApp2"],
      "server-key"
    );
    const configSpecs = await statsig.getConfigSpecs("server-key");
    expect(configSpecs.feature_gates).toHaveLength(2);
    expect(configSpecs.feature_gates).toEqual([
      expect.objectContaining({ name: "gate_1" }),
      expect.objectContaining({ name: "gate_2" }),
    ]);
  });

  it("Hashed keys to entities", async () => {
    await statsig.createGate("gate_1", {
      enabled: true,
    });
    await statsig.createGate("gate_2", {
      enabled: true,
    });
    await statsig.createConfig("config_1", {
      enabled: true,
      defaultValue: {},
    });
    await statsig.createConfig("config_2", {
      enabled: true,
      defaultValue: {},
    });
    await statsig.createExperiment("exp_1", {
      enabled: true,
      defaultValue: {},
      groups: [
        { name: "Test", parameters: {} },
        { name: "Control", parameters: {} },
      ],
      started: true,
    });
    await statsig.createExperiment("exp_2", {
      enabled: true,
      defaultValue: {},
      groups: [
        { name: "Test", parameters: {} },
        { name: "Control", parameters: {} },
      ],
      started: true,
    });
    await statsig.createTargetApp("clientApp", {
      gates: new Set(["gate_1"]),
      configs: new Set(["config_1"]),
      experiments: new Set(["exp_1"]),
    });
    await statsig.registerSDKKey("server-key");
    await statsig.registerSDKKey("client-key");
    await statsig.assignTargetAppsToSDKKey(["clientApp"], "client-key");
    const configSpecs = await statsig.getConfigSpecs("server-key");
    const hashedClientKey = HashUtils.hashString("client-key");
    expect(configSpecs.hashed_sdk_keys_to_entities).toEqual({
      [hashedClientKey]: {
        gates: ["gate_1"],
        configs: ["config_1", "exp_1"],
      },
    });
  });

  it("Get list of Target Apps after creation", async () => {
    await statsig.createTargetApp("serverApp", {
      gates: new Set(["gate_1"]),
      configs: new Set(["config_1"]),
      experiments: new Set(["exp_1"]),
    });
    await statsig.createTargetApp("clientApp", {
      gates: new Set(["gate_2"]),
      configs: new Set(["config_2"]),
      experiments: new Set(["exp_2"]),
    });
    const targetAppNames = await statsig.getTargetAppNames();
    expect(targetAppNames).toEqual(new Set(["serverApp", "clientApp"]));
  });

  it("Get list of Target Apps after deletion", async () => {
    await statsig.createTargetApp("serverApp", {
      gates: new Set(["gate_1"]),
      configs: new Set(["config_1"]),
      experiments: new Set(["exp_1"]),
    });
    await statsig.deleteTargetApp("serverApp");
    const targetAppNames = await statsig.getTargetAppNames();
    expect(targetAppNames).toEqual(new Set());
  });
});
