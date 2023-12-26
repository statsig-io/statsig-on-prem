import { DynamicConfig } from "../types/DynamicConfig";
import { Experiment } from "../types/Experiment";
import { FeatureGate } from "../types/FeatureGate";
import { EntityNames } from "../types/EntityNames";
import { ExhaustSwitchError } from "../Errors";
import HashUtils from "./HashUtils";
import { ConfigSpecs } from "../types/ConfigSpecs";

export enum StorageKeyType {
  FeatureGate,
  DynamicConfig,
  Experiment,
  EntityNames,
  TargetAppAssignment,
  SDKKey,
}

const GLOBAL_PREFIX = "statsig";

export default class StorageUtils {
  public static getStorageKey(id: string, type: StorageKeyType): string {
    const hashedID = HashUtils.hashString(id);
    switch (type) {
      case StorageKeyType.FeatureGate:
        return `${GLOBAL_PREFIX}:gate:${hashedID}`;
      case StorageKeyType.DynamicConfig:
        return `${GLOBAL_PREFIX}:config:${hashedID}`;
      case StorageKeyType.Experiment:
        return `${GLOBAL_PREFIX}:experiment:${hashedID}`;
      case StorageKeyType.EntityNames:
        return `${GLOBAL_PREFIX}:entities:${hashedID}`;
      case StorageKeyType.TargetAppAssignment:
        return `${GLOBAL_PREFIX}:${hashedID}:targetApp`;
      case StorageKeyType.SDKKey:
        return `${GLOBAL_PREFIX}:sdkKey:${hashedID}`;
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
  >(object: T, replaceSets = false): string {
    return JSON.stringify(object, (_key, value) =>
      value instanceof Set && replaceSets ? Array.from(value) : value
    );
  }

  public static serializeSets<T extends EntityNames>(object: T): string {
    return this.serialize<T>(object, true);
  }

  public static deserialize<
    T extends
      | FeatureGate
      | Experiment
      | DynamicConfig
      | EntityNames
      | ConfigSpecs
  >(value: string, reviveSets = false): T {
    return JSON.parse(value, (_key, value) =>
      value instanceof Array && reviveSets ? new Set(value) : value
    ) as T;
  }

  public static deserializeSets<T extends EntityNames>(value: string): T {
    return this.deserialize<T>(value, true);
  }
}
