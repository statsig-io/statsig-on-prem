import { DynamicConfig } from "../types/DynamicConfig";
import { Experiment } from "../types/Experiment";
import { FeatureGate } from "../types/FeatureGate";
import { EntityNames } from "../types/EntityNames";
import { ExhaustSwitchError } from "../Errors";
import HashUtils from "./HashUtils";
import { APIEntityType, ConfigSpecs } from "../types/ConfigSpecs";
import { TargetAppNames } from "../types/TargetAppNames";

export enum StorageKeyType {
  FeatureGate,
  DynamicConfig,
  Experiment,
  EntityNames,
  TargetAppNames,
  TargetAppAssignment,
  SDKKey,
  SDKKeys,
}

export type SupportedAPIEntityType = Exclude<
  APIEntityType,
  APIEntityType.SEGMENT | APIEntityType.LAYER
>;

const GLOBAL_PREFIX = "statsig";

export const GLOBAL_ASSOC_KEY = "";

export default class StorageUtils {
  public static getStorageKey(type: StorageKeyType, id?: string): string {
    const hashedID = id ? HashUtils.hashString(id) : "";
    switch (type) {
      case StorageKeyType.FeatureGate:
        return `${GLOBAL_PREFIX}:gate:${hashedID}`;
      case StorageKeyType.DynamicConfig:
        return `${GLOBAL_PREFIX}:config:${hashedID}`;
      case StorageKeyType.Experiment:
        return `${GLOBAL_PREFIX}:experiment:${hashedID}`;
      case StorageKeyType.EntityNames:
        return `${GLOBAL_PREFIX}:entities:${hashedID}`;
      case StorageKeyType.TargetAppNames:
        return `${GLOBAL_PREFIX}:targetApps`;
      case StorageKeyType.TargetAppAssignment:
        return `${GLOBAL_PREFIX}:${hashedID}:targetApp`;
      case StorageKeyType.SDKKey:
        return `${GLOBAL_PREFIX}:sdkKey:${hashedID}`;
      case StorageKeyType.SDKKeys:
        return `${GLOBAL_PREFIX}:sdkKeys`;
      default:
        throw new ExhaustSwitchError(type);
    }
  }

  public static getStorageKeyTypeForEntityType(
    type: SupportedAPIEntityType
  ): StorageKeyType {
    switch (type) {
      case APIEntityType.FEATURE_GATE:
      case APIEntityType.HOLDOUT:
        return StorageKeyType.FeatureGate;
      case APIEntityType.DYNAMIC_CONFIG:
        return StorageKeyType.DynamicConfig;
      case APIEntityType.EXPERIMENT:
      case APIEntityType.AUTOTUNE:
        return StorageKeyType.Experiment;
      default:
        throw new ExhaustSwitchError(type);
    }
  }

  public static getEntityGroupKeyForEntityType(
    type: SupportedAPIEntityType
  ): keyof EntityNames {
    switch (type) {
      case APIEntityType.FEATURE_GATE:
      case APIEntityType.HOLDOUT:
        return "gates";
      case APIEntityType.DYNAMIC_CONFIG:
        return "configs";
      case APIEntityType.EXPERIMENT:
      case APIEntityType.AUTOTUNE:
        return "experiments";
      default:
        throw new ExhaustSwitchError(type);
    }
  }

  public static serialize<
    T extends
      | FeatureGate
      | Experiment
      | DynamicConfig
      | EntityNames
      | ConfigSpecs
      | TargetAppNames
  >(object: T, replaceSets = false): string {
    return JSON.stringify(object, (_key, value) =>
      value instanceof Set && replaceSets ? Array.from(value) : value
    );
  }

  public static serializeSets<T extends EntityNames | TargetAppNames>(
    object: T
  ): string {
    return this.serialize<T>(object, true);
  }

  public static deserialize<
    T extends
      | FeatureGate
      | Experiment
      | DynamicConfig
      | EntityNames
      | ConfigSpecs
      | TargetAppNames
  >(value: string, reviveSets = false): T {
    return JSON.parse(value, (_key, value) =>
      value instanceof Array && reviveSets ? new Set(value) : value
    ) as T;
  }

  public static deserializeSets<T extends EntityNames | TargetAppNames>(
    value: string
  ): T {
    return this.deserialize<T>(value, true);
  }
}
