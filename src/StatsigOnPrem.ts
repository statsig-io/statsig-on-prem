import { StatsigInterface } from "./interfaces/StatsigInterface";
import { StorageInterface } from "./interfaces/StorageInterface";
import type {
  DynamicConfig,
  DynamicConfigMetadata,
} from "./types/DynamicConfig";
import type { Experiment, ExperimentMetadata } from "./types/Experiment";
import type { FeatureGate, FeatureGateMetadata } from "./types/FeatureGate";
import { EntityNames } from "./types/EntityNames";
import StorageUtils, { StorageKeyType } from "./utils/StorageUtils";
import { ConfigSpecs } from "./types/ConfigSpecs";
import ConfigSpecsUtils from "./utils/ConfigSpecsUtils";
import { filterNulls } from "./utils/filterNulls";
import EntityExperiment from "./entities/EntityExperiment";
import EntityDynamicConfig from "./entities/EntityDynamicConfig";
import EntityFeatureGate from "./entities/EntityFeatureGate";
import { IDUtils } from "./utils/IDUtils";

export default class StatsigOnPrem implements StatsigInterface {
  private cache: {
    specs: Record<string, ConfigSpecs>;
  };

  public constructor(private storage: StorageInterface) {
    this.cache = { specs: {} };
  }

  public async initialize(): Promise<void> {
    await this.storage.initialize();
  }

  public async shutdown(): Promise<void> {
    await this.storage.shutdown();
  }

  private async clearCache(sdkKey?: string): Promise<void> {
    if (sdkKey) {
      delete this.cache.specs[sdkKey];
    } else {
      this.cache.specs = {};
    }
  }

  private async saveToCache(specs: ConfigSpecs, sdkKey: string): Promise<void> {
    this.cache.specs[sdkKey] = specs;
  }

  public async getConfigSpecs(sdkKey: string): Promise<ConfigSpecs> {
    const targetApp = await this.storage.get(
      StorageUtils.getStorageKey(sdkKey, StorageKeyType.TargetAppAssignment)
    );
    const entities = await this.getEntityNames(targetApp);
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
    await this.saveToCache(configSpecs, sdkKey);
    return configSpecs;
  }

  private async getEntityNames(
    targetApp?: string | null
  ): Promise<EntityNames> {
    const existing = await this.storage.get(
      StorageUtils.getStorageKey(targetApp ?? "", StorageKeyType.EntityNames)
    );
    return existing
      ? StorageUtils.deserializeSets<EntityNames>(existing)
      : { gates: new Set(), experiments: new Set(), configs: new Set() };
  }

  private async updateEntityNames(
    entities: Partial<EntityNames>,
    mutation: "add" | "remove",
    targetApp?: string
  ): Promise<void> {
    const existing = await this.getEntityNames();
    const operation = (set: Set<string>) =>
      mutation === "add" ? set.add : set.delete;
    if (entities.gates) {
      entities.gates.forEach(operation(existing.gates), existing.gates);
    }
    if (entities.configs) {
      entities.configs.forEach(operation(existing.configs), existing.configs);
    }
    if (entities.experiments) {
      entities.experiments?.forEach(
        operation(existing.experiments),
        existing.experiments
      );
    }
    await this.storage.set(
      StorageUtils.getStorageKey(targetApp ?? "", StorageKeyType.EntityNames),
      StorageUtils.serializeSets(existing)
    );
    await this.clearCache();
  }

  /* Feature Gate */

  public async getGate(name: string): Promise<FeatureGate | null> {
    const value = await this.storage.get(
      StorageUtils.getStorageKey(name, StorageKeyType.FeatureGate)
    );
    return value ? StorageUtils.deserialize<FeatureGate>(value) : null;
  }

  public async createGate(
    name: string,
    metadata: FeatureGateMetadata
  ): Promise<void> {
    await this.storage.set(
      StorageUtils.getStorageKey(name, StorageKeyType.FeatureGate),
      StorageUtils.serialize({
        name,
        salt: IDUtils.generateNewSalt(),
        ...metadata,
      })
    );
    await this.clearCache();
    await this.updateEntityNames({ gates: new Set([name]) }, "add");
  }

  public async updateGate(
    name: string,
    metadata: Partial<FeatureGateMetadata>
  ): Promise<void> {
    const existing = await this.getGate(name);
    if (existing == null) {
      console.warn("Attempting to update non-existent gate");
      return;
    }
    await this.storage.set(
      StorageUtils.getStorageKey(name, StorageKeyType.FeatureGate),
      StorageUtils.serialize({ ...existing, ...metadata })
    );
    await this.clearCache();
  }

  public async deleteGate(name: string): Promise<void> {
    await this.storage.delete(
      StorageUtils.getStorageKey(name, StorageKeyType.FeatureGate)
    );
    await this.clearCache();
    await this.updateEntityNames({ gates: new Set([name]) }, "remove");
  }

  /* Experiment */

  public async getExperiment(name: string): Promise<Experiment | null> {
    const value = await this.storage.get(
      StorageUtils.getStorageKey(name, StorageKeyType.Experiment)
    );
    return value ? StorageUtils.deserialize<Experiment>(value) : null;
  }

  public async createExperiment(
    name: string,
    metadata: ExperimentMetadata
  ): Promise<void> {
    await this.storage.set(
      StorageUtils.getStorageKey(name, StorageKeyType.Experiment),
      StorageUtils.serialize({
        name,
        salt: IDUtils.generateNewSalt(),
        ...metadata,
      })
    );
    await this.clearCache();
    await this.updateEntityNames({ experiments: new Set([name]) }, "add");
  }

  public async updateExperiment(
    name: string,
    metadata: Partial<ExperimentMetadata>
  ): Promise<void> {
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
    await this.storage.set(
      StorageUtils.getStorageKey(name, StorageKeyType.Experiment),
      StorageUtils.serialize({ ...existing, ...metadata })
    );
    await this.clearCache();
  }

  public async deleteExperiment(name: string): Promise<void> {
    await this.storage.delete(
      StorageUtils.getStorageKey(name, StorageKeyType.Experiment)
    );
    await this.clearCache();
    await this.updateEntityNames({ experiments: new Set([name]) }, "remove");
  }

  public async startExperiment(name: string): Promise<void> {
    const existing = await this.getExperiment(name);
    if (existing == null) {
      console.warn("Attempting to start an experiment that doesn't exist");
      return;
    }
    if (existing.started) {
      console.warn("Attempting to start an experiment that has already started");
      return;
    }
    await this.storage.set(
      StorageUtils.getStorageKey(name, StorageKeyType.Experiment),
      StorageUtils.serialize({ ...existing, started: true })
    );
    await this.clearCache();
  }

  /* Dynamic Config */

  public async getConfig(name: string): Promise<DynamicConfig | null> {
    const value = await this.storage.get(
      StorageUtils.getStorageKey(name, StorageKeyType.DynamicConfig)
    );
    return value ? StorageUtils.deserialize<DynamicConfig>(value) : null;
  }

  public async createConfig(
    name: string,
    metadata: DynamicConfigMetadata
  ): Promise<void> {
    await this.storage.set(
      StorageUtils.getStorageKey(name, StorageKeyType.DynamicConfig),
      StorageUtils.serialize({
        name,
        salt: IDUtils.generateNewSalt(),
        ...metadata,
      })
    );
    await this.clearCache();
    await this.updateEntityNames({ configs: new Set([name]) }, "add");
  }

  public async updateConfig(
    name: string,
    metadata: Partial<DynamicConfigMetadata>
  ): Promise<void> {
    const existing = await this.getConfig(name);
    if (existing == null) {
      console.warn("Attempting to update non-existent config");
      return;
    }
    await this.storage.set(
      StorageUtils.getStorageKey(name, StorageKeyType.DynamicConfig),
      StorageUtils.serialize({ ...existing, ...metadata })
    );
    await this.clearCache();
  }

  public async deleteConfig(name: string): Promise<void> {
    await this.storage.delete(
      StorageUtils.getStorageKey(name, StorageKeyType.DynamicConfig)
    );
    await this.clearCache();
    await this.updateEntityNames({ configs: new Set([name]) }, "remove");
  }

  /* Target App */

  public async createTargetApp(
    name: string,
    entities: EntityNames
  ): Promise<void> {
    if (name === "") {
      console.error("Invalid name for target app");
      return;
    }
    await this.storage.set(
      StorageUtils.getStorageKey(name, StorageKeyType.EntityNames),
      StorageUtils.serializeSets(entities)
    );
    await this.clearCache();
  }

  public async updateTargetApp(
    name: string,
    entities: Partial<EntityNames>
  ): Promise<void> {
    const existing = await this.getEntityNames(name);
    if (existing == null) {
      console.warn("Attempting to update non-existent target app");
      return;
    }
    await this.storage.set(
      StorageUtils.getStorageKey(name, StorageKeyType.EntityNames),
      StorageUtils.serializeSets({ ...existing, ...entities })
    );
    await this.clearCache();
  }

  public async deleteTargetApp(name: string): Promise<void> {
    await this.storage.delete(
      StorageUtils.getStorageKey(name, StorageKeyType.EntityNames)
    );
    await this.clearCache();
  }

  public async addEntitiesToTargetApp(
    targetApp: string,
    entities: EntityNames
  ): Promise<void> {
    const existing = await this.getEntityNames(targetApp);
    if (existing == null) {
      console.warn("Attempting to add entities to a non-existent target app");
      return;
    }
    await this.updateEntityNames(entities, "add", targetApp);
  }

  public async removeEntitiesFromTargetApp(
    targetApp: string,
    entities: EntityNames
  ): Promise<void> {
    const existing = await this.getEntityNames(targetApp);
    if (existing == null) {
      console.warn(
        "Attempting to remove entities from a non-existent target app"
      );
      return;
    }
    await this.updateEntityNames(entities, "remove", targetApp);
  }

  public async assignTargetAppToSDKKey(
    targetApp: string,
    sdkKey: string
  ): Promise<void> {
    await this.storage.set(
      StorageUtils.getStorageKey(sdkKey, StorageKeyType.TargetAppAssignment),
      targetApp
    );
    await this.clearCache(sdkKey);
  }

  public async clearTargetAppFromSDKKey(sdkKey: string): Promise<void> {
    await this.storage.delete(
      StorageUtils.getStorageKey(sdkKey, StorageKeyType.TargetAppAssignment)
    );
    await this.clearCache(sdkKey);
  }

  /* SDK Keys */

  public async registerSDKKey(sdkKey: string): Promise<void> {
    await this.storage.set(
      StorageUtils.getStorageKey(sdkKey, StorageKeyType.SDKKey),
      "registered"
    );
  }

  public async deactivateSDKKey(sdkKey: string): Promise<void> {
    await this.storage.delete(
      StorageUtils.getStorageKey(sdkKey, StorageKeyType.SDKKey)
    );
    await this.clearCache(sdkKey);
  }
}
