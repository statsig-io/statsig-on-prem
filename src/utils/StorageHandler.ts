import { StorageInterface } from "../interfaces/StorageInterface";
import { APIEntityType } from "../types/ConfigSpecs";
import { DynamicConfig } from "../types/DynamicConfig";
import { EntityNames } from "../types/EntityNames";
import { Experiment } from "../types/Experiment";
import { FeatureGate } from "../types/FeatureGate";
import { MutationType } from "../types/MutationType";
import { TargetAppNames } from "../types/TargetAppNames";
import StorageUtils, {
  GLOBAL_ASSOC_KEY,
  StorageKeyType,
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
    config: FeatureGate,
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
      StorageUtils.getStorageKey(StorageKeyType.EntityNames, name),
      StorageUtils.serializeSets(entities)
    );
    await this.updateTargetAppNames(new Set([name]), MutationType.Add);
  }

  public async updateTargetApp(
    name: string,
    entities: EntityNames
  ): Promise<void> {
    await this.storage.set(
      StorageUtils.getStorageKey(StorageKeyType.EntityNames, name),
      StorageUtils.serializeSets(entities)
    );
  }

  public async removeTargetApp(name: string): Promise<void> {
    await this.storage.delete(
      StorageUtils.getStorageKey(StorageKeyType.EntityNames, name)
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

  public async getTargetAppFromSDKKey(sdkKey: string): Promise<string | null> {
    return await this.storage.get(
      StorageUtils.getStorageKey(StorageKeyType.TargetAppAssignment, sdkKey)
    );
  }

  public async assignTargetAppToSDKKey(
    targetApp: string,
    sdkKey: string
  ): Promise<void> {
    await this.storage.set(
      StorageUtils.getStorageKey(StorageKeyType.TargetAppAssignment, sdkKey),
      targetApp
    );
  }

  public async clearTargetAppFromSDKKey(sdkKey: string): Promise<void> {
    await this.storage.delete(
      StorageUtils.getStorageKey(StorageKeyType.TargetAppAssignment, sdkKey)
    );
  }

  public async addSDKKey(sdkKey: string): Promise<void> {
    await this.storage.set(
      StorageUtils.getStorageKey(StorageKeyType.SDKKey, sdkKey),
      "registered"
    );
  }

  public async removeSDKKey(sdkKey: string): Promise<void> {
    await this.storage.delete(
      StorageUtils.getStorageKey(StorageKeyType.SDKKey, sdkKey)
    );
  }

  public async getEntityAssocs(targetApp?: string): Promise<EntityNames> {
    const existing = await this.storage.get(
      StorageUtils.getStorageKey(
        StorageKeyType.EntityNames,
        targetApp ?? GLOBAL_ASSOC_KEY
      )
    );
    return existing
      ? StorageUtils.deserializeSets<EntityNames>(existing)
      : { gates: new Set(), experiments: new Set(), configs: new Set() };
  }

  private async updateEntityAssocs(
    entities: Partial<EntityNames>,
    mutation: MutationType,
    targetApp?: string
  ): Promise<void> {
    const existing = await this.getEntityAssocs(targetApp);
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
        StorageKeyType.EntityNames,
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
      StorageUtils.getStorageKey(
        StorageUtils.getStorageKeyTypeForEntityType(type),
        name
      )
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
        StorageUtils.getStorageKeyTypeForEntityType(type),
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
        StorageUtils.getStorageKeyTypeForEntityType(type),
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
      StorageUtils.getStorageKey(
        StorageUtils.getStorageKeyTypeForEntityType(type),
        name
      )
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

  private async getTargetAppNames(): Promise<TargetAppNames> {
    const serialized = await this.storage.get(
      StorageUtils.getStorageKey(StorageKeyType.TargetAppNames)
    );
    return serialized
      ? StorageUtils.deserializeSets<TargetAppNames>(serialized)
      : new Set();
  }

  private async updateTargetAppNames(
    targetApps: Set<string>,
    mutation: MutationType
  ): Promise<void> {
    const existing = await this.getTargetAppNames();
    const operation = (set: Set<string>) => {
      switch (mutation) {
        case MutationType.Add:
          return set.add;
        case MutationType.Remove:
          return set.delete;
      }
    };
    targetApps.forEach(operation(existing), existing);

    await this.storage.set(
      StorageUtils.getStorageKey(StorageKeyType.TargetAppNames),
      StorageUtils.serializeSets(existing)
    );
  }
}
