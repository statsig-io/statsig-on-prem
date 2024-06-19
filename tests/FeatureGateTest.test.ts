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
});
