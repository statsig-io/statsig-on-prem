import { DynamicConfig } from "../types/DynamicConfig";
import { Experiment } from "../types/Experiment";
import { FeatureGate } from "../types/FeatureGate";
import { EntityNames } from "../types/EntityNames";
import { ExhaustSwitchError } from "../Errors";
import HashUtils from "./HashUtils";
import { APIEntityType, ConfigSpecs } from "../types/ConfigSpecs";
import { TargetAppNames } from "../types/TargetAppNames";

export enum Assoc {
  FEATURE_GATE,
  DYNAMIC_CONFIG,
  EXPERIMENT,
  TARGET_APPS,
  TARGET_APP_TO_ENTITY_NAMES,
  SDK_KEY_TO_TARGET_APPS,
  TARGET_APP_TO_SDK_KEYS,
  SDK_KEY,
  SDK_KEYS,
}

export type SupportedAPIEntityType = Exclude<
  APIEntityType,
  APIEntityType.SEGMENT | APIEntityType.LAYER
>;

const GLOBAL_PREFIX = "statsig";

export const GLOBAL_ASSOC_KEY = "";

export default class StorageUtils {
  public static getStorageKey(type: Assoc, id?: string): string {
    const hashedID = id ? HashUtils.hashString(id) : "";
    switch (type) {
      case Assoc.FEATURE_GATE:
        return `${GLOBAL_PREFIX}:gate:${hashedID}`;
      case Assoc.DYNAMIC_CONFIG:
        return `${GLOBAL_PREFIX}:config:${hashedID}`;
      case Assoc.EXPERIMENT:
        return `${GLOBAL_PREFIX}:experiment:${hashedID}`;
      case Assoc.TARGET_APP_TO_ENTITY_NAMES:
        return `${GLOBAL_PREFIX}:entities:${hashedID}`;
      case Assoc.TARGET_APPS:
        return `${GLOBAL_PREFIX}:targetApps`;
      case Assoc.SDK_KEY_TO_TARGET_APPS:
        return `${GLOBAL_PREFIX}:${hashedID}:targetApps`;
      case Assoc.TARGET_APP_TO_SDK_KEYS:
        return `${GLOBAL_PREFIX}:${hashedID}:sdkKeys`;
      case Assoc.SDK_KEY:
        return `${GLOBAL_PREFIX}:sdkKey:${hashedID}`;
      case Assoc.SDK_KEYS:
        return `${GLOBAL_PREFIX}:sdkKeys`;
      default:
        throw new ExhaustSwitchError(type);
    }
  }

  public static getAssocForEntityType(type: SupportedAPIEntityType): Assoc {
    switch (type) {
      case APIEntityType.FEATURE_GATE:
      case APIEntityType.HOLDOUT:
        return Assoc.FEATURE_GATE;
      case APIEntityType.DYNAMIC_CONFIG:
        return Assoc.DYNAMIC_CONFIG;
      case APIEntityType.EXPERIMENT:
      case APIEntityType.AUTOTUNE:
        return Assoc.EXPERIMENT;
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

  public static mergeSets<T>(sets: Set<T>[]): Set<T> {
    let initialValue: T[] = [];
    return new Set(
      sets.reduce((acc, set) => [...acc, ...Array.from(set)], initialValue)
    );
  }
}
