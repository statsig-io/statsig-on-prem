import { StorageInterface } from "../interfaces/StorageInterface";
import { APIEntityType } from "../types/ConfigSpecs";
import { DynamicConfig } from "../types/DynamicConfig";
import { EntityNames } from "../types/EntityNames";
import { Experiment } from "../types/Experiment";
import { FeatureGate } from "../types/FeatureGate";
import { MutationType } from "../types/MutationType";
import { TargetAppNames } from "../types/TargetAppNames";
import { filterNulls } from "./filterNulls";
import StorageUtils, {
  GLOBAL_ASSOC_KEY,
  Assoc,
  SupportedAPIEntityType,
} from "./StorageUtils";

export default class StorageHandler {
  public constructor(private storage: StorageInterface) {}

  public async initialize(): Promise<void> {
    await this.storage.initialize();
  }

  public async shutdown(): Promise<void> {
    await this.storage.shutdown();
  }

  public async getGate(name: string): Promise<FeatureGate | null> {
    return await this.getEntity(name, APIEntityType.FEATURE_GATE);
  }

  public async addGate(
    name: string,
    gate: FeatureGate,
    targetApps?: string[]
  ): Promise<void> {
    await this.addEntity(name, gate, APIEntityType.FEATURE_GATE, targetApps);
  }

  public async updateGate(
    name: string,
    gate: FeatureGate,
    targetApps?: string[]
  ): Promise<void> {
    await this.updateEntity(name, gate, APIEntityType.FEATURE_GATE, targetApps);
  }

  public async removeGate(name: string): Promise<void> {
    await this.removeEntity(name, APIEntityType.FEATURE_GATE);
  }

  public async getConfig(name: string): Promise<DynamicConfig | null> {
    return await this.getEntity(name, APIEntityType.DYNAMIC_CONFIG);
  }

  public async addConfig(
    name: string,
    config: DynamicConfig,
    targetApps?: string[]
  ): Promise<void> {
    await this.addEntity(
      name,
      config,
      APIEntityType.DYNAMIC_CONFIG,
      targetApps
    );
  }

  public async updateConfig(
    name: string,
    config: DynamicConfig,
    targetApps?: string[]
  ): Promise<void> {
    await this.updateEntity(
      name,
      config,
      APIEntityType.DYNAMIC_CONFIG,
      targetApps
    );
  }

  public async removeConfig(name: string): Promise<void> {
    await this.removeEntity(name, APIEntityType.DYNAMIC_CONFIG);
  }

  public async getExperiment(name: string): Promise<Experiment | null> {
    return await this.getEntity(name, APIEntityType.EXPERIMENT);
  }

  public async addExperiment(
    name: string,
    experiment: Experiment,
    targetApps?: string[]
  ): Promise<void> {
    await this.addEntity(
      name,
      experiment,
      APIEntityType.EXPERIMENT,
      targetApps
    );
  }

  public async updateExperiment(
    name: string,
    experiment: Experiment,
    targetApps?: string[]
  ): Promise<void> {
    await this.updateEntity(
      name,
      experiment,
      APIEntityType.EXPERIMENT,
      targetApps
    );
  }

  public async removeExperiment(name: string): Promise<void> {
    await this.removeEntity(name, APIEntityType.EXPERIMENT);
  }

  public async addTargetApp(
    name: string,
    entities: EntityNames
  ): Promise<void> {
    await this.storage.set(
      StorageUtils.getStorageKey(Assoc.TARGET_APP_TO_ENTITY_NAMES, name),
      StorageUtils.serializeSets(entities)
    );
    await this.updateTargetAppNames(new Set([name]), MutationType.Add);
  }

  public async updateTargetApp(
    name: string,
    entities: EntityNames
  ): Promise<void> {
    await this.storage.set(
      StorageUtils.getStorageKey(Assoc.TARGET_APP_TO_ENTITY_NAMES, name),
      StorageUtils.serializeSets(entities)
    );
  }

  public async removeTargetApp(name: string): Promise<void> {
    await this.storage.delete(
      StorageUtils.getStorageKey(Assoc.TARGET_APP_TO_ENTITY_NAMES, name)
    );
    await this.updateTargetAppNames(new Set([name]), MutationType.Remove);
  }

  public async addEntityAssocs(
    entities: Partial<EntityNames>,
    targetApp?: string
  ): Promise<void> {
    await this.updateEntityAssocs(entities, MutationType.Add, targetApp);
  }

  public async removeEntityAssocs(
    entities: Partial<EntityNames>,
    targetApp?: string
  ): Promise<void> {
    await this.updateEntityAssocs(entities, MutationType.Remove, targetApp);
  }

  public async getSDKKeysForTargetApp(
    targetApp: string
  ): Promise<Set<string> | null> {
    const sdkKeys = await this.storage.get(
      StorageUtils.getStorageKey(Assoc.TARGET_APP_TO_SDK_KEYS, targetApp)
    );
    return sdkKeys ? StorageUtils.deserializeSets<Set<string>>(sdkKeys) : null;
  }

  public async getTargetAppsFromSDKKey(
    sdkKey: string
  ): Promise<TargetAppNames | null> {
    const targetApps = await this.storage.get(
      StorageUtils.getStorageKey(Assoc.SDK_KEY_TO_TARGET_APPS, sdkKey)
    );
    return targetApps
      ? StorageUtils.deserializeSets<TargetAppNames>(targetApps)
      : null;
  }

  private async addSDKKeyToTargetApp(
    targetApp: string,
    sdkKey: string
  ): Promise<void> {
    const existing =
      (await this.getSDKKeysForTargetApp(targetApp)) ?? new Set([]);
    await this.updateSet(existing, new Set(sdkKey), MutationType.Add);
    return this.storage.set(
      StorageUtils.getStorageKey(Assoc.TARGET_APP_TO_SDK_KEYS, targetApp),
      StorageUtils.serializeSets(existing)
    );
  }

  public async assignTargetAppsToSDKKey(
    targetApps: string[],
    sdkKey: string
  ): Promise<void> {
    const existing =
      (await this.getTargetAppsFromSDKKey(sdkKey)) ?? new Set([]);
    await this.updateSet(existing, new Set(targetApps), MutationType.Add);
    await this.storage.set(
      StorageUtils.getStorageKey(Assoc.SDK_KEY_TO_TARGET_APPS, sdkKey),
      StorageUtils.serializeSets(existing)
    );
    await Promise.all(
      targetApps.map(async (targetApp) =>
        this.addSDKKeyToTargetApp(targetApp, sdkKey)
      )
    );
  }

  private async removeSDKKeyFromTargetApp(
    targetApp: string,
    sdkKey: string
  ): Promise<void> {
    const existing =
      (await this.getSDKKeysForTargetApp(targetApp)) ?? new Set([]);
    await this.updateSet(existing, new Set(sdkKey), MutationType.Add);
    return this.storage.set(
      StorageUtils.getStorageKey(Assoc.TARGET_APP_TO_SDK_KEYS, targetApp),
      StorageUtils.serializeSets(existing)
    );
  }

  public async removeTargetAppsFromSDKKey(
    targetApps: string[],
    sdkKey: string
  ): Promise<void> {
    const existing =
      (await this.getTargetAppsFromSDKKey(sdkKey)) ?? new Set([]);
    await this.updateSet(existing, new Set(targetApps), MutationType.Remove);
    await this.storage.set(
      StorageUtils.getStorageKey(Assoc.SDK_KEY_TO_TARGET_APPS, sdkKey),
      StorageUtils.serializeSets(existing)
    );
    await Promise.all(
      targetApps.map(async (targetApp) =>
        this.removeSDKKeyFromTargetApp(targetApp, sdkKey)
      )
    );
  }

  public async clearTargetAppsFromSDKKey(sdkKey: string): Promise<void> {
    const existing = await this.getTargetAppsFromSDKKey(sdkKey);
    await this.storage.delete(
      StorageUtils.getStorageKey(Assoc.SDK_KEY_TO_TARGET_APPS, sdkKey)
    );
    if (existing) {
      await Promise.all(
        Array.from(existing).map(async (targetApp) =>
          this.removeSDKKeyFromTargetApp(targetApp, sdkKey)
        )
      );
    }
  }

  public async addSDKKey(sdkKey: string): Promise<void> {
    await this.storage.set(
      StorageUtils.getStorageKey(Assoc.SDK_KEY, sdkKey),
      "registered"
    );
    await this.updateRegisteredSDKKeys(new Set([sdkKey]), MutationType.Add);
  }

  public async removeSDKKey(sdkKey: string): Promise<void> {
    await this.storage.delete(
      StorageUtils.getStorageKey(Assoc.SDK_KEY, sdkKey)
    );
    await this.updateRegisteredSDKKeys(new Set([sdkKey]), MutationType.Remove);
  }

  public async getEntityAssocs(
    targetApp?: string
  ): Promise<EntityNames | null> {
    const existing = await this.storage.get(
      StorageUtils.getStorageKey(
        Assoc.TARGET_APP_TO_ENTITY_NAMES,
        targetApp ?? GLOBAL_ASSOC_KEY
      )
    );
    return existing
      ? StorageUtils.deserializeSets<EntityNames>(existing)
      : null;
  }

  public async getEntityAssocsForMultipleTargetApps(
    targetApps?: TargetAppNames | null
  ): Promise<EntityNames | null> {
    const assocs = filterNulls(
      await Promise.all(
        Array.from(targetApps ?? [GLOBAL_ASSOC_KEY]).map((targetApp) =>
          this.getEntityAssocs(targetApp)
        )
      )
    );

    return {
      gates: StorageUtils.mergeSets(assocs.map((assoc) => assoc.gates)),
      configs: StorageUtils.mergeSets(assocs.map((assoc) => assoc.configs)),
      experiments: StorageUtils.mergeSets(
        assocs.map((assoc) => assoc.experiments)
      ),
    };
  }

  public async getTargetAppNames(): Promise<TargetAppNames> {
    const serialized = await this.storage.get(
      StorageUtils.getStorageKey(Assoc.TARGET_APPS)
    );
    return serialized
      ? StorageUtils.deserializeSets<TargetAppNames>(serialized)
      : new Set();
  }

  private async updateEntityAssocs(
    entities: Partial<EntityNames>,
    mutation: MutationType,
    targetApp?: string
  ): Promise<void> {
    const existing = (await this.getEntityAssocs(targetApp)) ?? {
      gates: new Set(),
      experiments: new Set(),
      configs: new Set(),
    };
    const operation = (set: Set<string>) => {
      switch (mutation) {
        case MutationType.Add:
          return set.add;
        case MutationType.Remove:
          return set.delete;
      }
    };
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
      StorageUtils.getStorageKey(
        Assoc.TARGET_APP_TO_ENTITY_NAMES,
        targetApp ?? GLOBAL_ASSOC_KEY
      ),
      StorageUtils.serializeSets(existing)
    );
  }

  private async getEntity<T extends FeatureGate | DynamicConfig | Experiment>(
    name: string,
    type: SupportedAPIEntityType
  ): Promise<T | null> {
    const value = await this.storage.get(
      StorageUtils.getStorageKey(StorageUtils.getAssocForEntityType(type), name)
    );
    return value ? StorageUtils.deserialize<T>(value) : null;
  }

  private async addEntity<T extends FeatureGate | DynamicConfig | Experiment>(
    name: string,
    entity: T,
    type: SupportedAPIEntityType,
    targetApps?: string[]
  ): Promise<void> {
    await this.storage.set(
      StorageUtils.getStorageKey(
        StorageUtils.getAssocForEntityType(type),
        name
      ),
      StorageUtils.serialize(entity)
    );

    const entityNames = {
      [StorageUtils.getEntityGroupKeyForEntityType(type)]: new Set([name]),
    };
    await this.addEntityAssocs(entityNames);
    if (targetApps) {
      await Promise.all(
        targetApps.map((targetApp) =>
          this.addEntityAssocs(entityNames, targetApp)
        )
      );
    }
  }

  private async updateEntity<
    T extends FeatureGate | DynamicConfig | Experiment
  >(
    name: string,
    entity: T,
    type: SupportedAPIEntityType,
    newTargetApps?: string[]
  ): Promise<void> {
    await this.storage.set(
      StorageUtils.getStorageKey(
        StorageUtils.getAssocForEntityType(type),
        name
      ),
      StorageUtils.serialize(entity)
    );

    if (newTargetApps) {
      const entityNames = {
        [StorageUtils.getEntityGroupKeyForEntityType(type)]: new Set([name]),
      };
      const allTargetApps = await this.getTargetAppNames();
      await Promise.all(
        Array.from(allTargetApps).map((targetApp) =>
          newTargetApps.includes(targetApp)
            ? this.addEntityAssocs(entityNames, targetApp)
            : this.removeEntityAssocs(entityNames, targetApp)
        )
      );
    }
  }

  private async removeEntity(
    name: string,
    type: SupportedAPIEntityType
  ): Promise<void> {
    await this.storage.delete(
      StorageUtils.getStorageKey(StorageUtils.getAssocForEntityType(type), name)
    );
    const entityNames = {
      [StorageUtils.getEntityGroupKeyForEntityType(type)]: new Set([name]),
    };
    const targetApps = await this.getTargetAppNames();
    await Promise.all(
      Array.from(targetApps).map((targetApp) =>
        this.removeEntityAssocs(entityNames, targetApp)
      )
    );
    await this.removeEntityAssocs(entityNames);
  }

  private async updateTargetAppNames(
    targetApps: Set<string>,
    mutation: MutationType
  ): Promise<void> {
    const existing = await this.getTargetAppNames();
    await this.updateSet(existing, targetApps, mutation);

    await this.storage.set(
      StorageUtils.getStorageKey(Assoc.TARGET_APPS),
      StorageUtils.serializeSets(existing)
    );
  }

  public async getRegisteredSDKKeys(): Promise<Set<string>> {
    const serialized = await this.storage.get(
      StorageUtils.getStorageKey(Assoc.SDK_KEYS)
    );
    return serialized
      ? StorageUtils.deserializeSets<Set<string>>(serialized)
      : new Set();
  }

  private async updateRegisteredSDKKeys(
    sdkKeys: Set<string>,
    mutation: MutationType
  ): Promise<void> {
    const existing = await this.getRegisteredSDKKeys();
    await this.updateSet(existing, sdkKeys, mutation);

    await this.storage.set(
      StorageUtils.getStorageKey(Assoc.SDK_KEYS),
      StorageUtils.serializeSets(existing)
    );
  }

  // Updates the existing set in-place
  private async updateSet<T>(
    existing: Set<T>,
    updating: Set<T>,
    mutation: MutationType
  ): Promise<void> {
    const operation = (set: Set<T>) => {
      switch (mutation) {
        case MutationType.Add:
          return set.add;
        case MutationType.Remove:
          return set.delete;
      }
    };
    updating.forEach(operation(existing), existing);
  }
}
