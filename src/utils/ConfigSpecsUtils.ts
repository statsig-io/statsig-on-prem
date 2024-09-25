import EntityDynamicConfig from "../entities/EntityDynamicConfig";
import EntityFeatureGate from "../entities/EntityFeatureGate";
import EntityExperiment from "../entities/EntityExperiment";
import type {
  APIConfigSpec,
  APIEntityNames,
  ConfigSpecs,
} from "../types/ConfigSpecs";
import HashUtils from "./HashUtils";
import { filterNulls } from "./filterNulls";
import type { EntityNames } from "../types/EntityNames";
import StorageHandler from "./StorageHandler";

export type ConfigSpecsOptions = { ssr?: SSROptions };

export type SSROptions = {
  targetApps?: string[] | "all";
  clientKeys?: string[] | "all";
};

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

  public static async getHashedSDKKeysToEntities(
    store: StorageHandler,
    options: SSROptions
  ): Promise<Record<string, APIEntityNames>> {
    const getEntitiesFromKey = async (
      key: string
    ): Promise<EntityNames | null> => {
      const targetApps = await store.getTargetAppsFromSDKKey(key);
      if (targetApps == null) {
        return null;
      }
      return await store.getEntityAssocsForMultipleTargetApps(targetApps);
    };

    const getEntitiesFromTargetApp = async (
      targetApp: string
    ): Promise<EntityNames | null> => {
      return await store.getEntityAssocs(targetApp);
    };

    let mappings: {
      source: string;
      load: (source: string) => Promise<EntityNames | null>;
    }[] = [];

    if (options.clientKeys) {
      const keys =
        options.clientKeys === "all"
          ? Array.from(await store.getRegisteredSDKKeys())
          : options.clientKeys;
      mappings = mappings.concat(
        keys.map((key) => ({
          source: key,
          load: getEntitiesFromKey,
        }))
      );
    }
    if (options.targetApps) {
      const targetApps =
        options.targetApps === "all"
          ? Array.from(await store.getTargetAppNames())
          : options.targetApps;
      mappings = mappings.concat(
        targetApps.map((targetApp) => ({
          source: targetApp,
          load: getEntitiesFromTargetApp,
        }))
      );
    }

    return Object.fromEntries(
      new Map(
        filterNulls(
          await Promise.all(
            mappings.map(async ({ source, load }) => {
              const entities = await load(source);
              if (entities == null) {
                return null;
              }
              return [
                HashUtils.hashString(source),
                {
                  gates: Array.from(entities.gates),
                  configs: [
                    ...Array.from(entities.configs),
                    ...Array.from(entities.experiments),
                  ],
                },
              ];
            })
          )
        )
      )
    );
  }
}
