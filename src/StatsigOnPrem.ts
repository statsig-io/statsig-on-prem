import { StatsigInterface } from "./interfaces/StatsigInterface";
import { StorageInterface } from "./interfaces/StorageInterface";
import type {
  DynamicConfig,
  DynamicConfigCreationArgs,
} from "./types/DynamicConfig";
import type { Experiment, ExperimentCreationArgs } from "./types/Experiment";
import type { FeatureGate, FeatureGateCreationArgs } from "./types/FeatureGate";
import { EntityNames } from "./types/EntityNames";
import { GLOBAL_ASSOC_KEY } from "./utils/StorageUtils";
import { ConfigSpecs } from "./types/ConfigSpecs";
import ConfigSpecsUtils from "./utils/ConfigSpecsUtils";
import { filterNulls } from "./utils/filterNulls";
import EntityExperiment from "./entities/EntityExperiment";
import EntityDynamicConfig from "./entities/EntityDynamicConfig";
import EntityFeatureGate from "./entities/EntityFeatureGate";
import { IDUtils } from "./utils/IDUtils";
import { SpecsCacheInterface } from "./interfaces/SpecsCacheInterface";
import SpecsCache from "./SpecsCache";
import StorageHandler from "./utils/StorageHandler";
import CacheUtils from "./utils/CacheUtils";
import HashUtils from "./utils/HashUtils";

export default class StatsigOnPrem implements StatsigInterface {
  private store: StorageHandler;
  private cache: SpecsCacheInterface;
  public constructor(storage: StorageInterface, cache?: SpecsCacheInterface) {
    this.store = new StorageHandler(storage);
    this.cache = cache ?? new SpecsCache();
  }

  public async initialize(): Promise<void> {
    await this.store.initialize();
  }

  public async shutdown(): Promise<void> {
    await this.store.shutdown();
  }

  public async clearCache(): Promise<void> {
    await this.cache.clearAll();
  }

  public async getConfigSpecs(sdkKey: string): Promise<ConfigSpecs> {
    const targetApp = await this.store.getTargetAppFromSDKKey(sdkKey);
    const cacheKey = CacheUtils.getCacheKey(targetApp);
    const cachedSpecs = await this.cache.get(cacheKey);
    if (cachedSpecs) {
      return cachedSpecs;
    }

    const entities = await this.store.getEntityAssocs(targetApp ?? undefined);
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

    const registeredKeys = await this.store.getRegisteredSDKKeys();

    const hashedSDKKeysToEntityNames = new Map(
      filterNulls(
        await Promise.all(
          Array.from(registeredKeys).map(async (key) => {
            const targetApp = await this.store.getTargetAppFromSDKKey(key);
            if (targetApp == null) {
              return null;
            }
            const entities = await this.store.getEntityAssocs(targetApp);
            if (entities == null) {
              return null;
            }
            const hashedKey = HashUtils.hashString(key);
            return [
              hashedKey,
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
    );

    const configSpecs: ConfigSpecs = {
      feature_gates: gates.map((gate) => ConfigSpecsUtils.getConfigSpec(gate)),
      dynamic_configs: [...configs, ...experiments].map((config) =>
        ConfigSpecsUtils.getConfigSpec(config)
      ),
      layer_configs: [],
      layers: {},
      hashed_sdk_keys_to_entities: Object.fromEntries(
        hashedSDKKeysToEntityNames
      ),
      has_updates: true,
      time: Date.now(),
    };
    await this.cache.set(cacheKey, configSpecs);
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
      idType: idType ?? 'userID',
      ...metadata,
    };
    await this.store.addGate(name, gate, targetApps);
    await this.cache.clearAll();
  }

  public async updateGate(
    name: string,
    args: Partial<FeatureGateCreationArgs>
  ): Promise<void> {
    const { targetApps, ...metadata } = args;
    const existing = await this.getGate(name);
    if (existing == null) {
      console.warn("Attempting to update non-existent gate");
      return;
    }
    const updatedGate: FeatureGate = { ...existing, ...metadata };
    await this.store.updateGate(name, updatedGate, targetApps);
    await this.cache.clearAll();
  }

  public async deleteGate(name: string): Promise<void> {
    await this.store.removeGate(name);
    await this.cache.clearAll();
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
      idType: idType ?? 'userID',
      ...metadata,
    };
    await this.store.addExperiment(name, experiment, targetApps);
    await this.cache.clearAll();
  }

  public async updateExperiment(
    name: string,
    args: Partial<ExperimentCreationArgs>
  ): Promise<void> {
    const { targetApps, ...metadata } = args;
    const existing = await this.getExperiment(name);
    if (existing == null) {
      console.warn("Attempting to update non-existent experiment");
      return;
    }
    if (existing.started) {
      console.warn(
        "Attempting to update an experiment that has already started"
      );
      return;
    }
    const updatedExperiment: Experiment = { ...existing, ...metadata };
    await this.store.updateExperiment(name, updatedExperiment, targetApps);
    await this.cache.clearAll();
  }

  public async deleteExperiment(name: string): Promise<void> {
    await this.store.removeExperiment(name);
    await this.cache.clearAll();
  }

  public async startExperiment(name: string): Promise<void> {
    const existing = await this.getExperiment(name);
    if (existing == null) {
      console.warn("Attempting to start an experiment that doesn't exist");
      return;
    }
    if (existing.started) {
      console.warn(
        "Attempting to start an experiment that has already started"
      );
      return;
    }
    const updatedExperiment: Experiment = { ...existing, started: true };
    await this.store.updateExperiment(name, updatedExperiment);
    await this.cache.clearAll();
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
      idType: idType ?? 'userID',
      ...metadata,
    };
    await this.store.addConfig(name, config, targetApps);
    await this.cache.clearAll();
  }

  public async updateConfig(
    name: string,
    args: Partial<DynamicConfigCreationArgs>
  ): Promise<void> {
    const { targetApps, ...metadata } = args;
    const existing = await this.getConfig(name);
    if (existing == null) {
      console.warn("Attempting to update non-existent config");
      return;
    }
    const updatedConfig: DynamicConfig = { ...existing, ...metadata };
    await this.store.updateConfig(name, updatedConfig, targetApps);
    await this.cache.clearAll();
  }

  public async deleteConfig(name: string): Promise<void> {
    await this.store.removeConfig(name);
    await this.cache.clearAll();
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
    await this.cache.clearAll();
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
    await this.cache.clearAll();
  }

  public async deleteTargetApp(name: string): Promise<void> {
    await this.store.removeTargetApp(name);
    await this.cache.clearAll();
  }

  public async addEntitiesToTargetApp(
    targetApp: string,
    entities: EntityNames
  ): Promise<void> {
    await this.store.addEntityAssocs(entities, targetApp);
    await this.cache.clear(CacheUtils.getCacheKey(targetApp));
  }

  public async removeEntitiesFromTargetApp(
    targetApp: string,
    entities: EntityNames
  ): Promise<void> {
    await this.store.removeEntityAssocs(entities, targetApp);
    await this.cache.clear(CacheUtils.getCacheKey(targetApp));
  }

  public async assignTargetAppToSDKKey(
    targetApp: string,
    sdkKey: string
  ): Promise<void> {
    await this.store.assignTargetAppToSDKKey(targetApp, sdkKey);
    await this.cache.clear(CacheUtils.getCacheKey(targetApp));
  }

  public async clearTargetAppFromSDKKey(sdkKey: string): Promise<void> {
    await this.store.clearTargetAppFromSDKKey(sdkKey);
    const targetApp = await this.store.getTargetAppFromSDKKey(sdkKey);
    if (targetApp) {
      await this.cache.clear(CacheUtils.getCacheKey(targetApp));
    }
  }

  /* SDK Keys */

  public async registerSDKKey(sdkKey: string): Promise<void> {
    await this.store.addSDKKey(sdkKey);
  }

  public async deactivateSDKKey(sdkKey: string): Promise<void> {
    await this.store.removeSDKKey(sdkKey);
    const targetApp = await this.store.getTargetAppFromSDKKey(sdkKey);
    if (targetApp) {
      await this.cache.clear(CacheUtils.getCacheKey(targetApp));
    }
  }
}
