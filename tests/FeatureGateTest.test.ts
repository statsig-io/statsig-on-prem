import StatsigStorageExample from "../examples/StatsigStorageExample";
import StatsigOnPrem from "../src/StatsigOnPrem";
import StatsigSDK from "statsig-node";
import StatsigInstanceUtils from "statsig-node/dist/StatsigInstanceUtils";
import Evaluator from "statsig-node/dist/Evaluator";

describe("Feature Gate", () => {
  const storage = new StatsigStorageExample();
  const statsig = new StatsigOnPrem(storage);
  const sdkKey = "secret-key";

  beforeEach(async () => {
    await statsig.initialize();
    await statsig.registerSDKKey(sdkKey);
  });

  afterEach(async () => {
    storage.clearAll();
    await statsig.clearCache();
    jest.clearAllMocks();
  });

  it("Create Gate", async () => {
    await statsig.createGate("test-gate", { enabled: true });
    const configSpecs = await statsig.getConfigSpecs(sdkKey);
    await StatsigSDK.initialize("secret-key", {
      bootstrapValues: JSON.stringify(configSpecs),
    });
    expect(StatsigSDK.checkGateSync({ userID: "123" }, "test-gate")).toEqual(
      true
    );
    StatsigSDK.shutdown();
  });

  it("Update Gate", async () => {
    await statsig.createGate("test-gate", { enabled: true });
    await statsig.updateGate("test-gate", { enabled: false });
    const configSpecs = await statsig.getConfigSpecs(sdkKey);
    await StatsigSDK.initialize("secret-key", {
      bootstrapValues: JSON.stringify(configSpecs),
    });
    expect(StatsigSDK.checkGateSync({ userID: "123" }, "test-gate")).toEqual(
      false
    );
    StatsigSDK.shutdown();
  });

  it("Delete Gate", async () => {
    await statsig.createGate("test-gate", { enabled: true });
    await statsig.deleteGate("test-gate");
    const configSpecs = await statsig.getConfigSpecs(sdkKey);
    await StatsigSDK.initialize("secret-key", {
      bootstrapValues: JSON.stringify(configSpecs),
    });
    const StatsigSDKEvaluator = (StatsigInstanceUtils.getInstance() as any)
      ._evaluator as Evaluator;
    const evaluation = StatsigSDKEvaluator.checkGate(
      { userID: "123" },
      "test-gate"
    );
    expect(evaluation.value).toEqual(false);
    expect(evaluation.evaluation_details?.reason).toEqual("Unrecognized");
    StatsigSDK.shutdown();
  });

  it("Target apps", async () => {
    await statsig.createGate("test-gate", { enabled: true });
    let gate = await statsig.getGate("test-gate");
    expect(gate?.targetApps).toEqual(new Set([]));

    await statsig.addTargetAppsToGate("test-gate", ["target-app-1"]);
    gate = await statsig.getGate("test-gate");
    expect(gate?.targetApps).toEqual(new Set(["target-app-1"]));

    await statsig.removeTargetAppsFromGate("test-gate", ["target-app-1"]);
    gate = await statsig.getGate("test-gate");
    expect(gate?.targetApps).toEqual(new Set());
  });

  describe("Update Gate interactions with storage", () => {
    let storageSpy: { [key: string]: jest.SpyInstance };
    beforeEach(async () => {
      const emptyTargetApp = {
        gates: new Set([]),
        configs: new Set([]),
        experiments: new Set([]),
      };
      await statsig.createTargetApp("irrelevant_target_app", emptyTargetApp);
      await statsig.createTargetApp("irrelevant_target_app2", emptyTargetApp);
      await statsig.createTargetApp("target_app", emptyTargetApp);

      storageSpy = {
        set: jest.spyOn(storage, "set"),
        get: jest.spyOn(storage, "get"),
        delete: jest.spyOn(storage, "delete"),
      };

    });

    it("update gate should only update storage for impacted target apps", async () => {
      await statsig.createGate("test-gate", { enabled: true });
      storageSpy.set.mockClear();

      await statsig.updateGate("test-gate", { targetApps: ["target_app"] });
      expect(storageSpy.set).toHaveBeenNthCalledWith(1, expect.stringMatching("statsig:entities:*"), expect.anything())
      expect(storageSpy.set).toHaveBeenNthCalledWith(2, expect.stringMatching("statsig:gate:*"), expect.anything())
      expect(storageSpy.set).toHaveBeenCalledTimes(2);
    });

    it("update gate should not update target apps if none were associated", async () => {
      await statsig.createGate("test-gate", { enabled: true });
      storageSpy.set.mockClear();

      await statsig.updateGate("test-gate", { enabled: false });
      expect(storageSpy.set).toHaveBeenNthCalledWith(1, expect.stringMatching("statsig:gate:*"), expect.anything())
      expect(storageSpy.set).toHaveBeenCalledTimes(1);
    });

    it("update gate should not update target apps if update target apps arg is empty and no prior target app", async () => {
      await statsig.createGate("test-gate", { enabled: true });
      storageSpy.set.mockClear();

      await statsig.updateGate("test-gate", { enabled: false, targetApps: [] });
      expect(storageSpy.set).toHaveBeenNthCalledWith(1, expect.stringMatching("statsig:gate:*"), expect.anything())
      expect(storageSpy.set).toHaveBeenCalledTimes(1);
    });

    it("update gate should remove target app if update target apps arg is empty and there is a prior target app", async () => {
      await statsig.createGate("test-gate", { enabled: true, targetApps: ["target_app"] });
      storageSpy.set.mockClear();

      await statsig.updateGate("test-gate", { enabled: false, targetApps: [] });
      expect(storageSpy.set).toHaveBeenNthCalledWith(1, expect.stringMatching("statsig:entities:*"), expect.anything())
      expect(storageSpy.set).toHaveBeenNthCalledWith(2, expect.stringMatching("statsig:gate:*"), expect.anything())
      expect(storageSpy.set).toHaveBeenCalledTimes(2);
    });

    it("update gate should only update existing target apps", async () => {
      await statsig.createGate("test-gate", { enabled: true });
      storageSpy.set.mockClear();

      await statsig.updateGate("test-gate", { enabled: false, targetApps: ["non-existent-target-app"] });
      expect(storageSpy.set).toHaveBeenNthCalledWith(1, expect.stringMatching("statsig:gate:*"), expect.anything())
      expect(storageSpy.set).toHaveBeenCalledTimes(1);
    });
  });
});
