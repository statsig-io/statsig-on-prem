import { StorageInterface } from "../interfaces/StorageInterface";
import { APIEntityType } from "../types/ConfigSpecs";
import { DynamicConfig, DynamicConfigUpdateArgs } from "../types/DynamicConfig";
import { EntityNames } from "../types/EntityNames";
import { Experiment, ExperimentUpdateArgs } from "../types/Experiment";
import { FeatureGate, FeatureGateUpdateArgs } from "../types/FeatureGate";
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

  public async addGate(gate: FeatureGate): Promise<void> {
    await this.addEntity(gate, APIEntityType.FEATURE_GATE);
  }

  public async updateGate(
    gate: FeatureGate,
    args: FeatureGateUpdateArgs
  ): Promise<void> {
    const { targetApps, ...changes } = args;
    let updated: FeatureGate = { ...gate, ...changes };
    if (targetApps) {
      await this.updateGateTargetApps(
        updated,
        new Set(targetApps),
        MutationType.Replace
      );
    }
    await this.updateEntity(updated, APIEntityType.FEATURE_GATE);
  }

  public async removeGate(name: string): Promise<void> {
    await this.removeEntity(name, APIEntityType.FEATURE_GATE);
  }

  public async addTargetAppsToGate(
    gate: FeatureGate,
    targetApps: string[]
  ): Promise<void> {
    await this.updateGateTargetApps(
      gate,
      new Set(targetApps),
      MutationType.Add
    );
    await this.updateEntity(gate, APIEntityType.FEATURE_GATE);
  }

  public async removeTargetAppsFromGate(
    gate: FeatureGate,
    targetApps: string[]
  ): Promise<void> {
    await this.updateGateTargetApps(
      gate,
      new Set(targetApps),
      MutationType.Remove
    );
    await this.updateEntity(gate, APIEntityType.FEATURE_GATE);
  }

  public async getConfig(name: string): Promise<DynamicConfig | null> {
    return await this.getEntity(name, APIEntityType.DYNAMIC_CONFIG);
  }

  public async addConfig(config: DynamicConfig): Promise<void> {
    await this.addEntity(config, APIEntityType.DYNAMIC_CONFIG);
  }

  public async updateConfig(
    updated: DynamicConfig,
    args?: DynamicConfigUpdateArgs
  ): Promise<void> {
    if (args?.targetApps) {
      await this.updateConfigTargetApps(
        updated,
        new Set(args?.targetApps),
        MutationType.Replace
      );
    }
    await this.updateEntity(updated, APIEntityType.DYNAMIC_CONFIG);
  }

  public async removeConfig(name: string): Promise<void> {
    await this.removeEntity(name, APIEntityType.DYNAMIC_CONFIG);
  }

  public async addTargetAppsToConfig(
    config: DynamicConfig,
    targetApps: string[]
  ): Promise<void> {
    await this.updateConfigTargetApps(
      config,
      new Set(targetApps),
      MutationType.Add
    );
    await this.updateEntity(config, APIEntityType.DYNAMIC_CONFIG);
  }

  public async removeTargetAppsFromConfig(
    config: DynamicConfig,
    targetApps: string[]
  ): Promise<void> {
    await this.updateConfigTargetApps(
      config,
      new Set(targetApps),
      MutationType.Remove
    );
    await this.updateEntity(config, APIEntityType.DYNAMIC_CONFIG);
  }

  public async getExperiment(name: string): Promise<Experiment | null> {
    return await this.getEntity(name, APIEntityType.EXPERIMENT);
  }

  public async addExperiment(experiment: Experiment): Promise<void> {
    await this.addEntity(experiment, APIEntityType.EXPERIMENT);
  }

  public async updateExperiment(
    experiment: Experiment,
    args: ExperimentUpdateArgs
  ): Promise<void> {
    const { targetApps, ...changes } = args;
    let updated: Experiment = { ...experiment, ...changes };
    if (targetApps) {
      await this.updateExperimentTargetApps(
        updated,
        new Set(targetApps),
        MutationType.Replace
      );
    }
    await this.updateEntity(updated, APIEntityType.EXPERIMENT);
  }

  public async removeExperiment(name: string): Promise<void> {
    await this.removeEntity(name, APIEntityType.EXPERIMENT);
  }

  public async addTargetAppsToExperiment(
    experiment: Experiment,
    targetApps: string[]
  ): Promise<void> {
    await this.updateExperimentTargetApps(
      experiment,
      new Set(targetApps),
      MutationType.Add
    );
    await this.updateEntity(experiment, APIEntityType.EXPERIMENT);
  }

  public async removeTargetAppsFromExperiment(
    experiment: Experiment,
    targetApps: string[]
  ): Promise<void> {
    await this.updateExperimentTargetApps(
      experiment,
      new Set(targetApps),
      MutationType.Remove
    );
    await this.updateEntity(experiment, APIEntityType.EXPERIMENT);
  }

  public async addTargetApp(
    name: string,
    entities: EntityNames
  ): Promise<void> {
    await this.setAssoc({
      assoc: Assoc.TARGET_APP_TO_ENTITY_NAMES,
      source: name,
      destination: entities,
    });
    await this.updateTargetAppNames(new Set([name]), MutationType.Add);
  }

  public async updateTargetApp(
    name: string,
    entities: EntityNames
  ): Promise<void> {
    await this.setAssoc({
      assoc: Assoc.TARGET_APP_TO_ENTITY_NAMES,
      source: name,
      destination: entities,
    });
  }

  public async removeTargetApp(name: string): Promise<void> {
    await this.deleteAssoc({
      assoc: Assoc.TARGET_APP_TO_ENTITY_NAMES,
      source: name,
    });
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
    return await this.getAssoc<Set<string>>({
      assoc: Assoc.TARGET_APP_TO_SDK_KEYS,
      source: targetApp,
    });
  }

  public async getTargetAppsFromSDKKey(
    sdkKey: string
  ): Promise<TargetAppNames | null> {
    return await this.getAssoc<TargetAppNames>({
      assoc: Assoc.SDK_KEY_TO_TARGET_APPS,
      source: sdkKey,
    });
  }

  private async addSDKKeyToTargetApp(
    targetApp: string,
    sdkKey: string
  ): Promise<void> {
    const existing =
      (await this.getSDKKeysForTargetApp(targetApp)) ?? new Set([]);
    const updated = await this.updateSet(
      existing,
      new Set([sdkKey]),
      MutationType.Add
    );
    await this.setAssoc({
      assoc: Assoc.TARGET_APP_TO_SDK_KEYS,
      source: targetApp,
      destination: updated,
    });
  }

  public async assignTargetAppsToSDKKey(
    targetApps: string[],
    sdkKey: string
  ): Promise<void> {
    const existing =
      (await this.getTargetAppsFromSDKKey(sdkKey)) ?? new Set([]);
    const updated = await this.updateSet(
      existing,
      new Set(targetApps),
      MutationType.Add
    );
    await this.setAssoc({
      assoc: Assoc.SDK_KEY_TO_TARGET_APPS,
      source: sdkKey,
      destination: updated,
    });
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
    const updated = await this.updateSet(
      existing,
      new Set([sdkKey]),
      MutationType.Add
    );
    await this.setAssoc({
      assoc: Assoc.TARGET_APP_TO_SDK_KEYS,
      source: targetApp,
      destination: updated,
    });
  }

  public async removeTargetAppsFromSDKKey(
    targetApps: string[],
    sdkKey: string
  ): Promise<void> {
    const existing =
      (await this.getTargetAppsFromSDKKey(sdkKey)) ?? new Set([]);
    const updated = await this.updateSet(
      existing,
      new Set(targetApps),
      MutationType.Remove
    );
    await this.setAssoc({
      assoc: Assoc.SDK_KEY_TO_TARGET_APPS,
      source: sdkKey,
      destination: updated,
    });
    await Promise.all(
      targetApps.map(async (targetApp) =>
        this.removeSDKKeyFromTargetApp(targetApp, sdkKey)
      )
    );
  }

  public async clearTargetAppsFromSDKKey(sdkKey: string): Promise<void> {
    const targetApps = await this.getTargetAppsFromSDKKey(sdkKey);
    await this.deleteAssoc({
      assoc: Assoc.SDK_KEY_TO_TARGET_APPS,
      source: sdkKey,
    });
    if (targetApps) {
      await Promise.all(
        Array.from(targetApps).map(async (targetApp) =>
          this.removeSDKKeyFromTargetApp(targetApp, sdkKey)
        )
      );
    }
  }

  public async addSDKKey(sdkKey: string): Promise<Set<string>> {
    await this.setAssoc({
      assoc: Assoc.SDK_KEY,
      source: sdkKey,
      destination: "registered",
    });
    return await this.updateRegisteredSDKKeys(
      new Set([sdkKey]),
      MutationType.Add
    );
  }

  public async removeSDKKey(sdkKey: string): Promise<Set<string>> {
    await this.deleteAssoc({ assoc: Assoc.SDK_KEY, source: sdkKey });
    return await this.updateRegisteredSDKKeys(
      new Set([sdkKey]),
      MutationType.Remove
    );
  }

  public async getEntityAssocs(
    targetApp?: string
  ): Promise<EntityNames | null> {
    return await this.getAssoc<EntityNames>({
      assoc: Assoc.TARGET_APP_TO_ENTITY_NAMES,
      source: targetApp,
    });
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
    return (
      (await this.getAssoc<TargetAppNames>({
        assoc: Assoc.TARGET_APPS,
      })) ?? new Set()
    );
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
    if (entities.gates) {
      existing.gates = await this.updateSet(
        existing.gates,
        entities.gates,
        mutation
      );
    }
    if (entities.configs) {
      existing.configs = await this.updateSet(
        existing.configs,
        entities.configs,
        mutation
      );
    }
    if (entities.experiments) {
      existing.experiments = await this.updateSet(
        existing.experiments,
        entities.experiments,
        mutation
      );
    }

    await this.setAssoc({
      assoc: Assoc.TARGET_APP_TO_ENTITY_NAMES,
      source: targetApp,
      destination: existing,
    });
  }

  private async getEntity<T extends FeatureGate | DynamicConfig | Experiment>(
    name: string,
    type: SupportedAPIEntityType
  ): Promise<T | null> {
    return await this.getAssoc<T>({
      assoc: StorageUtils.getAssocForEntityType(type),
      source: name,
    });
  }

  private async addEntity<T extends FeatureGate | DynamicConfig | Experiment>(
    entity: T,
    type: SupportedAPIEntityType
  ): Promise<void> {
    await this.setAssoc({
      assoc: StorageUtils.getAssocForEntityType(type),
      source: entity.name,
      destination: entity,
    });

    const entityNames = {
      [StorageUtils.getEntityGroupKeyForEntityType(type)]: new Set([
        entity.name,
      ]),
    };
    await this.addEntityAssocs(entityNames);
    if (entity.targetApps) {
      await Promise.all(
        Array.from(entity.targetApps).map((targetApp) =>
          this.addEntityAssocs(entityNames, targetApp)
        )
      );
    }
  }

  private async updateGateTargetApps(
    gate: FeatureGate,
    targetApps: TargetAppNames,
    mutation: MutationType
  ): Promise<void> {
    await this.updateEntityTargetApps(
      gate,
      APIEntityType.FEATURE_GATE,
      targetApps,
      mutation
    );
  }

  private async updateConfigTargetApps(
    gate: FeatureGate,
    targetApps: TargetAppNames,
    mutation: MutationType
  ): Promise<void> {
    await this.updateEntityTargetApps(
      gate,
      APIEntityType.DYNAMIC_CONFIG,
      targetApps,
      mutation
    );
  }

  private async updateExperimentTargetApps(
    gate: FeatureGate,
    targetApps: TargetAppNames,
    mutation: MutationType
  ): Promise<void> {
    await this.updateEntityTargetApps(
      gate,
      APIEntityType.EXPERIMENT,
      targetApps,
      mutation
    );
  }

  private async updateEntityTargetApps<
    T extends FeatureGate | DynamicConfig | Experiment
  >(
    entity: T,
    type: SupportedAPIEntityType,
    targetApps: TargetAppNames,
    mutation: MutationType
  ): Promise<void> {
    const entityNames = {
      [StorageUtils.getEntityGroupKeyForEntityType(type)]: new Set([
        entity.name,
      ]),
    };

    if (mutation === MutationType.Add) {
      await Promise.all(
        Array.from(targetApps).map((targetApp) =>
          this.addEntityAssocs(entityNames, targetApp)
        )
      );
      entity.targetApps = await this.updateSet(
        entity.targetApps ?? new Set([]),
        targetApps,
        mutation
      );
    } else if (mutation === MutationType.Remove) {
      await Promise.all(
        Array.from(targetApps).map((targetApp) =>
          this.removeEntityAssocs(entityNames, targetApp)
        )
      );
      if (entity.targetApps !== undefined) {
        entity.targetApps = await this.updateSet(
          entity.targetApps,
          targetApps,
          mutation
        );
      }
    } else {
      const allTargetApps = await this.getTargetAppNames();
      await Promise.all(
        Array.from(allTargetApps).map((targetApp) =>
          Array.from(targetApps).includes(targetApp)
            ? this.addEntityAssocs(entityNames, targetApp)
            : this.removeEntityAssocs(entityNames, targetApp)
        )
      );
      entity.targetApps = targetApps;
    }
  }

  private async updateEntity<
    T extends FeatureGate | DynamicConfig | Experiment
  >(entity: T, type: SupportedAPIEntityType): Promise<void> {
    await this.setAssoc({
      assoc: StorageUtils.getAssocForEntityType(type),
      source: entity.name,
      destination: entity,
    });
  }

  private async removeEntity(
    name: string,
    type: SupportedAPIEntityType
  ): Promise<void> {
    await this.deleteAssoc({
      assoc: StorageUtils.getAssocForEntityType(type),
      source: name,
    });
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
    targetApps: TargetAppNames,
    mutation: MutationType
  ): Promise<void> {
    const existing = await this.getTargetAppNames();
    const updated = await this.updateSet(existing, targetApps, mutation);
    await this.setAssoc({ assoc: Assoc.TARGET_APPS, destination: updated });
  }

  public async getRegisteredSDKKeys(): Promise<Set<string>> {
    return (
      (await this.getAssoc<Set<string>>({ assoc: Assoc.SDK_KEYS })) ?? new Set()
    );
  }

  private async updateRegisteredSDKKeys(
    sdkKeys: Set<string>,
    mutation: MutationType
  ): Promise<Set<string>> {
    const existing = await this.getRegisteredSDKKeys();
    const updated = await this.updateSet(existing, sdkKeys, mutation);
    await this.setAssoc({ assoc: Assoc.SDK_KEYS, destination: updated });
    return updated;
  }

  private async updateSet<T>(
    existing: Set<T>,
    updating: Set<T>,
    mutation: MutationType
  ): Promise<Set<T>> {
    if (mutation === MutationType.Replace) {
      return updating;
    }
    const cloned = new Set(existing);
    const operation = (set: Set<T>) => {
      switch (mutation) {
        case MutationType.Add:
          return set.add;
        case MutationType.Remove:
          return set.delete;
      }
    };
    updating.forEach(operation(cloned), cloned);
    return cloned;
  }

  private async getAssoc<
    T extends
      | FeatureGate
      | Experiment
      | DynamicConfig
      | EntityNames
      | TargetAppNames
  >(args: { assoc: Assoc; source?: string }): Promise<T | null> {
    const { assoc, source } = args;
    const val = await this.storage.get(
      StorageUtils.getStorageKey(assoc, source)
    );
    return val ? StorageUtils.deserialize<T>(val) : null;
  }

  private async setAssoc(args: {
    assoc: Assoc;
    source?: string;
    destination: object | string;
  }): Promise<void> {
    const { assoc, source, destination } = args;
    await this.storage.set(
      StorageUtils.getStorageKey(assoc, source),
      typeof destination === "string"
        ? destination
        : StorageUtils.serialize(destination)
    );
  }

  private async deleteAssoc(args: {
    assoc: Assoc;
    source?: string;
  }): Promise<void> {
    const { assoc, source } = args;
    await this.storage.delete(StorageUtils.getStorageKey(assoc, source));
  }

  public async updateSerialization__V0_0_8_BETA(): Promise<void> {
    await Promise.all(
      [Assoc.SDK_KEYS, Assoc.TARGET_APPS].map(async (assoc) => {
        const deserialized = await this.getAssoc__DEPRECATED({ assoc });
        if (deserialized) {
          await this.setAssoc({ assoc, destination: deserialized });
        }
      })
    );

    const targetApps = await this.getTargetAppNames();
    await Promise.all(
      [Assoc.TARGET_APP_TO_SDK_KEYS, Assoc.TARGET_APP_TO_ENTITY_NAMES].map(
        async (assoc) => {
          await Promise.all(
            Array.from(targetApps).map(async (targetApp) => {
              const deserialized = await this.getAssoc__DEPRECATED({
                assoc,
                source: targetApp,
              });
              if (deserialized) {
                await this.setAssoc({
                  assoc,
                  source: targetApp,
                  destination: deserialized,
                });
              }
            })
          );
        }
      )
    );

    const sdkKeys = await this.getRegisteredSDKKeys();
    await Promise.all(
      Array.from(sdkKeys).map(async (sdkKey) => {
        const deserialized = await this.getAssoc__DEPRECATED({
          assoc: Assoc.SDK_KEY_TO_TARGET_APPS,
          source: sdkKey,
        });
        if (deserialized) {
          await this.setAssoc({
            assoc: Assoc.SDK_KEY_TO_TARGET_APPS,
            source: sdkKey,
            destination: deserialized,
          });
        }
      })
    );
  }

  private async getAssoc__DEPRECATED<
    T extends
      | FeatureGate
      | Experiment
      | DynamicConfig
      | EntityNames
      | TargetAppNames
  >(args: { assoc: Assoc; source?: string }): Promise<T | null> {
    const { assoc, source } = args;
    const val = await this.storage.get(
      StorageUtils.getStorageKey(assoc, source)
    );
    return val
      ? JSON.parse(val, (_key, value) =>
          value instanceof Array ? new Set(value) : value
        )
      : null;
  }
}
