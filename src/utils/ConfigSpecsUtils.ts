import EntityDynamicConfig from "../entities/EntityDynamicConfig";
import EntityFeatureGate from "../entities/EntityFeatureGate";
import EntityExperiment from "../entities/EntityExperiment";
import {
  APIConfigSpec,
  ConfigSpecs,
} from "../types/ConfigSpecs";

export default class ConfigSpecsUtils {
  public static getEmptyConfigSpecs(): ConfigSpecs {
    return {
      dynamic_configs: [],
      feature_gates: [],
      layer_configs: [],
      layers: {},
      has_updates: false,
      time: 0,
    };
  }

  public static getConfigSpec<
    T extends EntityFeatureGate | EntityDynamicConfig | EntityExperiment
  >(entity: T): APIConfigSpec {
    return {
      name: entity.getName(),
      type: entity.getAPIType(),
      salt: entity.getSalt(),
      defaultValue: entity.getDefaultValue(),
      enabled: entity.getIsEnabled(),
      rules: entity.getRules(),
      isDeviceBased: entity.getIsDeviceBased(),
      idType: entity.getIDType(),
      isActive:
        entity instanceof EntityExperiment ? entity.getIsActive() : undefined,
      entity: entity.getAPIEntity(),
    };
  }
}
