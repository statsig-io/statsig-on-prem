import { APIConfigRule, APIConfigType, APIEntityType } from "../types/ConfigSpecs";
import { DynamicConfig } from "../types/DynamicConfig";
import IEntity from "./IEntity";

export default class EntityDynamicConfig implements IEntity {
  public constructor(private config: DynamicConfig) {}
  getIsEnabled(): boolean {
    return this.config.enabled;
  }
  getName(): string {
    return this.config.name;
  }
  getSalt(): string {
    return this.config.salt;
  }
  getDefaultValue(): Record<string, unknown> {
    return this.config.defaultValue;
  }
  getRules(): APIConfigRule[] {
    return [];
  }
  getAPIType(): APIConfigType {
    return APIConfigType.DYNAMIC_CONFIG;
  }
  getIsDeviceBased(): boolean {
    return false;
  }
  getIDType(): string {
    return "userID";
  }
  getAPIEntity(): APIEntityType {
    return APIEntityType.DYNAMIC_CONFIG;
  }
}
