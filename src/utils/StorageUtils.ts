import { EntityNames } from "../types/EntityNames";
import { ExhaustSwitchError } from "../Errors";
import HashUtils from "./HashUtils";
import { APIEntityType } from "../types/ConfigSpecs";

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
    const hashedID = id ? HashUtils.hashString(id) : GLOBAL_ASSOC_KEY;
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

  public static serialize(object: object): string {
    return JSON.stringify(object, (_key, value) =>
      value instanceof Set
        ? { dataType: "Set", value: Array.from(value) }
        : value
    );
  }

  public static deserialize<T extends object>(value: string): T {
    return JSON.parse(value, (_key, value) =>
      value && value.dataType === "Set" ? new Set(value.value) : value
    ) as T;
  }

  public static mergeSets<T>(sets: Set<T>[]): Set<T> {
    let initialValue: T[] = [];
    return new Set(
      sets.reduce((acc, set) => [...acc, ...Array.from(set)], initialValue)
    );
  }
}
