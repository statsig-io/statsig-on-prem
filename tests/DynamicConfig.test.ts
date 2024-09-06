import StatsigStorageExample from "../examples/StatsigStorageExample";
import StatsigOnPrem from "../src/StatsigOnPrem";
import StatsigSDK from "statsig-node";
import StatsigInstanceUtils from "statsig-node/dist/StatsigInstanceUtils";
import Evaluator from "statsig-node/dist/Evaluator";
import ConfigRuleBuilder from "../src/utils/ConfigRuleBuilder";
import { ConfigConditionType } from "../src/types/conditions/ConfigCondition";
import { APIOperatorType } from "../src/types/ConfigSpecs";
import { IDUtils } from "../src/utils/IDUtils";

describe("Dynamic Config", () => {
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
    StatsigSDK.shutdown();
    jest.clearAllMocks();
  });

  it("Create Dynmaic Config", async () => {
    await statsig.createConfig("test-config", {
      defaultValue: { a_bool: true },
      enabled: true,
    });
    const configSpecs = await statsig.getConfigSpecs(sdkKey);
    await StatsigSDK.initialize("secret-key", {
      bootstrapValues: JSON.stringify(configSpecs),
    });
    const config = StatsigSDK.getConfigSync({ userID: "123" }, "test-config");
    expect(config.get("a_bool", false)).toEqual(true);
    StatsigSDK.shutdown();
  });

  it("Update Dynmaic Config", async () => {
    await statsig.createConfig("test-config", {
      defaultValue: { a_bool: true },
      enabled: true,
    });
    await statsig.updateConfig("test-config", {
      defaultValue: { a_bool: false },
    });
    const configSpecs = await statsig.getConfigSpecs(sdkKey);
    await StatsigSDK.initialize("secret-key", {
      bootstrapValues: JSON.stringify(configSpecs),
    });
    const config = StatsigSDK.getConfigSync({ userID: "123" }, "test-config");
    expect(config.get("a_bool", false)).toEqual(false);
  });

  it("Delete Dynmaic Config", async () => {
    await statsig.createConfig("test-config", {
      defaultValue: { a_bool: true },
      enabled: true,
    });
    await statsig.deleteConfig("test-config");
    const configSpecs = await statsig.getConfigSpecs(sdkKey);
    await StatsigSDK.initialize("secret-key", {
      bootstrapValues: JSON.stringify(configSpecs),
    });
    const StatsigSDKEvaluator = (StatsigInstanceUtils.getInstance() as any)
      ._evaluator as Evaluator;
    const evaluation = StatsigSDKEvaluator.getConfig(
      { userID: "123" },
      "test-config"
    );
    expect(evaluation.json_value).toEqual({});
    expect(evaluation.evaluation_details?.reason).toEqual("Unrecognized");
  });

  it("Target apps", async () => {
    await statsig.createConfig("test-config", {
      defaultValue: { a_bool: true },
      enabled: true,
    });
    let config = await statsig.getConfig("test-config");
    expect(config?.targetApps).toEqual(new Set([]));

    await statsig.addTargetAppsToConfig("test-config", ["target-app-1"]);
    config = await statsig.getConfig("test-config");
    expect(config?.targetApps).toEqual(new Set(["target-app-1"]));

    await statsig.removeTargetAppsFromConfig("test-config", ["target-app-1"]);
    config = await statsig.getConfig("test-config");
    expect(config?.targetApps).toEqual(new Set());
  });

  it("Update Dynmaic Config Rules", async () => {
    jest.spyOn(IDUtils, "generateNewSalt").mockReturnValue("mocked-salt");
    await statsig.createConfig("test-config", {
      defaultValue: { a_string: "default" },
      enabled: true,
    });
    const patchRules = (builder: ConfigRuleBuilder) => {
      builder.addRule({
        name: "Statsig Employee",
        conditions: [
          {
            type: ConfigConditionType.EMAIL,
            input: {
              operator: APIOperatorType.STR_CONTAINS_ANY,
              targetValue: ["@statsig.com"],
            },
          },
        ],
        value: { a_string: "statsig" },
        passPercentage: 100,
        idType: "userID",
      });
      const firstRule = builder.addRule({
        name: "Specific Users",
        conditions: [
          {
            type: ConfigConditionType.USER_ID,
            input: {
              operator: APIOperatorType.ANY,
              targetValue: ["123", "456"],
            },
          },
        ],
        value: { a_string: "user" },
        passPercentage: 100,
        idType: "userID",
      });
      builder.moveRuleUp(firstRule);
      return builder;
    };
    await statsig.updateConfig("test-config", { patchRules });
    const configSpecs = await statsig.getConfigSpecs(sdkKey);
    expect(configSpecs).toMatchSnapshot(
      { time: expect.any(Number) },
      "config-rules"
    );
    await StatsigSDK.initialize("secret-key", {
      bootstrapValues: JSON.stringify(configSpecs),
    });
    const config = StatsigSDK.getConfigSync(
      { userID: "123", email: "kenny@statsig.com" },
      "test-config"
    );
    expect(config.get("a_string", "default")).toEqual("user");
  });
});
