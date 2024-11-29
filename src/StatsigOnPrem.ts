import { StatsigInterface } from "./interfaces/StatsigInterface";
import { StorageInterface } from "./interfaces/StorageInterface";
import type {
  DynamicConfig,
  DynamicConfigCreationArgs,
  DynamicConfigUpdateArgs,
} from "./types/DynamicConfig";
import type {
  Experiment,
  ExperimentCreationArgs,
  ExperimentUpdateArgs,
} from "./types/Experiment";
import type {
  FeatureGate,
  FeatureGateCreationArgs,
  FeatureGateUpdateArgs,
} from "./types/FeatureGate";
import { EntityNames } from "./types/EntityNames";
import { GLOBAL_ASSOC_KEY } from "./utils/StorageUtils";
import { ConfigSpecs } from "./types/ConfigSpecs";
import ConfigSpecsUtils, { ConfigSpecsOptions } from "./utils/ConfigSpecsUtils";
import { filterNulls } from "./utils/filterNulls";
import EntityExperiment from "./entities/EntityExperiment";
import EntityDynamicConfig from "./entities/EntityDynamicConfig";
import EntityFeatureGate from "./entities/EntityFeatureGate";
import { IDUtils } from "./utils/IDUtils";
import { SpecsCacheInterface } from "./interfaces/SpecsCacheInterface";
import StorageHandler from "./utils/StorageHandler";
import { TargetAppNames } from "./types/TargetAppNames";
import CacheHandler from "./utils/CacheHandler";
import { SDKKeysCacheInterface } from "./interfaces/SDKKeyCacheInterface";
import ConfigRuleBuilder from "./utils/ConfigRuleBuilder";
import { genFilter } from "./utils/genFilter";

type Plugins = Partial<{
  specsCache: SpecsCacheInterface;
  sdkKeysCache: SDKKeysCacheInterface;
}>;

export default class StatsigOnPrem implements StatsigInterface {
  private store: StorageHandler;
  private cache: CacheHandler;
  public constructor(storage: StorageInterface, plugins?: Plugins) {
    this.store = new StorageHandler(storage);
    this.cache = new CacheHandler({
      specs: plugins?.specsCache,
      keys: plugins?.sdkKeysCache,
    });
  }

  public async initialize(): Promise<void> {
    await this.store.initialize();
  }

  public async shutdown(): Promise<void> {
    await this.store.shutdown();
  }

  public async clearCache(sdkKey?: string): Promise<void> {
    if (sdkKey) {
      await this.cache.clearSpecs(sdkKey);
    } else {
      await this.cache.clearAll();
    }
  }

  public async clearCacheForTargetApp(...targetApps: string[]): Promise<void> {
    await Promise.all(
      targetApps.map(async (targetApp) => {
        const sdkKeys = await this.store.getSDKKeysForTargetApp(targetApp);
        if (sdkKeys) {
          await this.cache.clearSpecs(...Array.from(sdkKeys));
        }
      })
    );
    const globalSDKKeys = await this.getGlobalSDKKeys();
    await this.cache.clearSpecs(...Array.from(globalSDKKeys));
  }

  public async clearCacheForEntity(
    entity: FeatureGate | Experiment | DynamicConfig
  ): Promise<void> {
    const targetApps = entity.targetApps;
    if (targetApps == null) {
      await this.cache.clearSpecs();
    } else {
      await this.clearCacheForTargetApp(...Array.from(targetApps));
    }
  }

  public async getConfigSpecs(
    sdkKey: string,
    options?: ConfigSpecsOptions
  ): Promise<ConfigSpecs> {
    const registeredKeys = await this.store.getRegisteredSDKKeys();
    if (!registeredKeys.has(sdkKey)) {
      console.warn("Attempting to use a non-registered key");
    }

    const cachedSpecs = await this.cache.getSpecs(sdkKey, options);
    if (cachedSpecs) {
      return cachedSpecs;
    }

    const targetApps = await this.store.getTargetAppsFromSDKKey(sdkKey);
    const entities = await this.store.getEntityAssocsForMultipleTargetApps(
      targetApps
    );
    if (entities == null) {
      return ConfigSpecsUtils.getEmptyConfigSpecs();
    }

    const gates = filterNulls(
      await Promise.all(
        Array.from(entities.gates).map((name) =>
          this.getGate(name).then((gate) =>
            gate ? new EntityFeatureGate(gate) : null
          )
        )
      )
    );
    const configs = filterNulls(
      await Promise.all(
        Array.from(entities.configs).map((name) =>
          this.getConfig(name).then((config) =>
            config ? new EntityDynamicConfig(config) : null
          )
        )
      )
    );
    const experiments = filterNulls(
      await Promise.all(
        Array.from(entities.experiments).map((name) =>
          this.getExperiment(name).then((exp) =>
            exp ? new EntityExperiment(exp) : null
          )
        )
      )
    );

    const configSpecs: ConfigSpecs = {
      feature_gates: gates.map((gate) => ConfigSpecsUtils.getConfigSpec(gate)),
      dynamic_configs: [...configs, ...experiments].map((config) =>
        ConfigSpecsUtils.getConfigSpec(config)
      ),
      layer_configs: [],
      layers: {},
      has_updates: true,
      time: Date.now(),
    };

    if (options?.ssr) {
      configSpecs.hashed_sdk_keys_to_entities =
        await ConfigSpecsUtils.getHashedSDKKeysToEntities(
          this.store,
          options?.ssr
        );
    }

    await this.cache.cacheSpecs(sdkKey, options, configSpecs);
    return configSpecs;
  }

  /* Feature Gate */

  public async getGate(name: string): Promise<FeatureGate | null> {
    return await this.store.getGate(name);
  }

  public async createGate(
    name: string,
    args: FeatureGateCreationArgs
  ): Promise<void> {
    const { targetApps, idType, ...metadata } = args;
    const gate: FeatureGate = {
      name,
      salt: IDUtils.generateNewSalt(),
      idType: idType ?? "userID",
      targetApps: new Set(targetApps ?? []),
      ...metadata,
    };
    await this.store.addGate(gate);
    await this.clearCacheForEntity(gate);
  }

  public async updateGate(
    name: string,
    args: FeatureGateUpdateArgs
  ): Promise<void> {
    const gate = await this.getGate(name);
    if (gate == null) {
      console.warn("Attempting to update non-existent gate");
      return;
    }
    await this.clearCacheForEntity(gate);
    await this.store.updateGate(gate, args);
    await this.clearCacheForEntity(gate);
  }

  public async deleteGate(name: string): Promise<void> {
    const gate = await this.store.getGate(name);
    if (!gate) {
      console.warn("Attempting to delete non-existent gate");
      return;
    }
    await this.store.removeGate(name);
    await this.clearCacheForEntity(gate);
  }

  public async addTargetAppsToGate(
    name: string,
    targetApps: string[]
  ): Promise<void> {
    const gate = await this.getGate(name);
    if (gate == null) {
      console.warn("Attempting to update non-existent gate");
      return;
    }
    await this.store.addTargetAppsToGate(gate, targetApps);
    await this.clearCacheForTargetApp(...targetApps);
  }

  public async removeTargetAppsFromGate(
    name: string,
    targetApps: string[]
  ): Promise<void> {
    const gate = await this.getGate(name);
    if (gate == null) {
      console.warn("Attempting to update non-existent gate");
      return;
    }
    await this.store.removeTargetAppsFromGate(gate, targetApps);
    await this.clearCacheForTargetApp(...targetApps);
  }

  /* Experiment */

  public async getExperiment(name: string): Promise<Experiment | null> {
    return await this.store.getExperiment(name);
  }

  public async createExperiment(
    name: string,
    args: ExperimentCreationArgs
  ): Promise<void> {
    const { targetApps, idType, ...metadata } = args;
    const experiment: Experiment = {
      name,
      salt: IDUtils.generateNewSalt(),
      idType: idType ?? "userID",
      targetApps: new Set(targetApps ?? []),
      ...metadata,
    };
    await this.store.addExperiment(experiment);
    await this.clearCacheForEntity(experiment);
  }

  public async updateExperiment(
    name: string,
    args: ExperimentUpdateArgs
  ): Promise<void> {
    const experiment = await this.getExperiment(name);
    if (experiment == null) {
      console.warn("Attempting to update non-existent experiment");
      return;
    }
    if (experiment.started) {
      console.warn(
        "Attempting to update an experiment that has already started"
      );
      return;
    }
    await this.clearCacheForEntity(experiment);
    await this.store.updateExperiment(experiment, args);
    await this.clearCacheForEntity(experiment);
  }

  public async deleteExperiment(name: string): Promise<void> {
    const experiment = await this.store.getExperiment(name);
    if (!experiment) {
      console.warn("Attempting to delete non-existent experiment");
      return;
    }
    await this.store.removeExperiment(name);
    await this.clearCacheForEntity(experiment);
  }

  public async startExperiment(name: string): Promise<void> {
    const experiment = await this.getExperiment(name);
    if (experiment == null) {
      console.warn("Attempting to start an experiment that doesn't exist");
      return;
    }
    if (experiment.started) {
      console.warn(
        "Attempting to start an experiment that has already started"
      );
      return;
    }
    await this.store.updateExperiment(experiment, { started: true });
    await this.clearCacheForEntity(experiment);
  }

  public async addTargetAppsToExperiment(
    name: string,
    targetApps: string[]
  ): Promise<void> {
    const experiment = await this.getExperiment(name);
    if (experiment == null) {
      console.warn("Attempting to update non-existent experiment");
      return;
    }
    await this.store.addTargetAppsToExperiment(experiment, targetApps);
    await this.clearCacheForTargetApp(...targetApps);
  }

  public async removeTargetAppsFromExperiment(
    name: string,
    targetApps: string[]
  ): Promise<void> {
    const experiment = await this.getExperiment(name);
    if (experiment == null) {
      console.warn("Attempting to update non-existent experiment");
      return;
    }
    await this.store.removeTargetAppsFromExperiment(experiment, targetApps);
    await this.clearCacheForTargetApp(...targetApps);
  }

  /* Dynamic Config */

  public async getConfig(name: string): Promise<DynamicConfig | null> {
    return await this.store.getConfig(name);
  }

  public async createConfig(
    name: string,
    args: DynamicConfigCreationArgs
  ): Promise<void> {
    const { targetApps, idType, ...metadata } = args;
    const config: DynamicConfig = {
      name,
      salt: IDUtils.generateNewSalt(),
      idType: idType ?? "userID",
      targetApps: new Set(targetApps ?? []),
      ...metadata,
    };
    await this.store.addConfig(config);
    await this.clearCacheForEntity(config);
  }

  public async updateConfig(
    name: string,
    args: DynamicConfigUpdateArgs
  ): Promise<void> {
    const config = await this.getConfig(name);
    if (config == null) {
      console.warn("Attempting to update non-existent config");
      return;
    }
    const { targetApps, patchRules, ...changes } = args;
    const updated: DynamicConfig = { ...config, ...changes };
    if (targetApps) {
      await this.clearCacheForTargetApp(...targetApps);
    }
    if (patchRules) {
      const builder = new ConfigRuleBuilder(config);
      updated.rulesJSON = patchRules(builder).getRulesJSON();
    }
    await this.store.updateConfig(updated, args);
    await this.clearCacheForEntity(config);
  }

  public async deleteConfig(name: string): Promise<void> {
    const config = await this.getConfig(name);
    if (!config) {
      console.warn("Attempting to delete non-existent config");
      return;
    }
    await this.store.removeConfig(name);
    await this.clearCacheForEntity(config);
  }

  public async addTargetAppsToConfig(
    name: string,
    targetApps: string[]
  ): Promise<void> {
    const config = await this.getConfig(name);
    if (config == null) {
      console.warn("Attempting to update non-existent config");
      return;
    }
    await this.store.addTargetAppsToConfig(config, targetApps);
    await this.clearCacheForTargetApp(...targetApps);
  }

  public async removeTargetAppsFromConfig(
    name: string,
    targetApps: string[]
  ): Promise<void> {
    const config = await this.getConfig(name);
    if (config == null) {
      console.warn("Attempting to update non-existent config");
      return;
    }
    await this.store.removeTargetAppsFromConfig(config, targetApps);
    await this.clearCacheForTargetApp(...targetApps);
  }

  /* Target App */

  public async createTargetApp(
    name: string,
    entities: EntityNames
  ): Promise<void> {
    if (name === GLOBAL_ASSOC_KEY) {
      console.error("Invalid name for target app");
      return;
    }
    const existing = await this.store.getEntityAssocs(name);
    if (existing != null) {
      console.warn(`Target app already exists with the name ${name}`);
      return;
    }
    await this.store.addTargetApp(name, entities);
    await this.clearCacheForTargetApp(name);
  }

  public async updateTargetApp(
    name: string,
    entities: Partial<EntityNames>
  ): Promise<void> {
    const existing = await this.store.getEntityAssocs(name);
    if (existing == null) {
      console.warn("Attempting to update non-existent target app");
      return;
    }
    await this.store.updateTargetApp(name, { ...existing, ...entities });
    await this.clearCacheForTargetApp(name);
  }

  public async deleteTargetApp(name: string): Promise<void> {
    await this.store.removeTargetApp(name);
    await this.clearCacheForTargetApp(name);
  }

  public async addEntitiesToTargetApp(
    targetApp: string,
    entities: EntityNames
  ): Promise<void> {
    await this.store.addEntityAssocs(entities, targetApp);
    await Promise.all([
      ...Array.from(entities.gates).map((gate) =>
        this.addTargetAppsToGate(gate, [targetApp])
      ),
      ...Array.from(entities.configs).map((config) =>
        this.addTargetAppsToConfig(config, [targetApp])
      ),
      ...Array.from(entities.experiments).map((experiment) =>
        this.addTargetAppsToExperiment(experiment, [targetApp])
      ),
    ]);
    await this.clearCacheForTargetApp(targetApp);
  }

  public async removeEntitiesFromTargetApp(
    targetApp: string,
    entities: EntityNames
  ): Promise<void> {
    await this.store.removeEntityAssocs(entities, targetApp);
    await Promise.all([
      ...Array.from(entities.gates).map((gate) =>
        this.removeTargetAppsFromGate(gate, [targetApp])
      ),
      ...Array.from(entities.configs).map((config) =>
        this.removeTargetAppsFromConfig(config, [targetApp])
      ),
      ...Array.from(entities.experiments).map((experiment) =>
        this.removeTargetAppsFromExperiment(experiment, [targetApp])
      ),
    ]);
    await this.clearCacheForTargetApp(targetApp);
  }

  public async assignTargetAppsToSDKKey(
    targetApps: string[],
    sdkKey: string
  ): Promise<void> {
    await this.store.assignTargetAppsToSDKKey(targetApps, sdkKey);
    await this.cache.clearSpecs(sdkKey);
    await this.cache.clearGlobalSDKKeys();
  }

  public async removeTargetAppsFromSDKKey(
    targetApps: string[],
    sdkKey: string
  ): Promise<void> {
    await this.store.removeTargetAppsFromSDKKey(targetApps, sdkKey);
    await this.cache.clearSpecs(sdkKey);
    await this.cache.clearGlobalSDKKeys();
  }

  public async clearTargetAppsFromSDKKey(sdkKey: string): Promise<void> {
    await this.store.clearTargetAppsFromSDKKey(sdkKey);
    await this.cache.clearSpecs(sdkKey);
    await this.cache.clearGlobalSDKKeys();
  }

  public async getTargetAppNames(
    sdkKey?: string
  ): Promise<TargetAppNames | null> {
    if (sdkKey) {
      return this.store.getTargetAppsFromSDKKey(sdkKey);
    }
    return this.store.getTargetAppNames();
  }

  /* SDK Keys */

  public async registerSDKKey(sdkKey: string): Promise<void> {
    const sdkKeys = await this.store.addSDKKey(sdkKey);
    await this.cache.cacheSDKKeys(sdkKeys);
    await this.cache.clearGlobalSDKKeys();
  }

  public async deactivateSDKKey(sdkKey: string): Promise<void> {
    const sdkKeys = await this.store.removeSDKKey(sdkKey);
    await this.cache.cacheSDKKeys(sdkKeys);
    await this.cache.clearSpecs(sdkKey);
    await this.cache.clearGlobalSDKKeys();
  }

  public async getRegisteredSDKKeys(): Promise<Set<string>> {
    const cachedKeys = await this.cache.getSDKKeys();
    if (cachedKeys) {
      return cachedKeys;
    }

    const sdkKeys = await this.store.getRegisteredSDKKeys();
    await this.cache.cacheSDKKeys(sdkKeys);
    return sdkKeys;
  }

  public async getGlobalSDKKeys(): Promise<Set<string>> {
    const cached = await this.cache.getGlobalSDKKeys();
    if (cached) {
      return cached;
    }
    const sdkKeys = await this.getRegisteredSDKKeys();
    const globalKeys = new Set(
      await genFilter(Array.from(sdkKeys), async (sdkKey) => {
        const targetApps = await this.store.getTargetAppsFromSDKKey(sdkKey);
        return targetApps == null;
      })
    );
    await this.cache.cacheGlobalSDKKeys(globalKeys);
    return globalKeys;
  }
}
