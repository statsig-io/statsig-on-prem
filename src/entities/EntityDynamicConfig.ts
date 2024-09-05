import {
  APIConfigRule,
  APIConfigType,
  APIEntityType,
} from "../types/ConfigSpecs";
import { DynamicConfig } from "../types/DynamicConfig";
import ConfigRuleLoader from "../utils/ConfigRuleLoader";
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
    const rules = ConfigRuleLoader.getRulesFromData(this.config.rulesJSON);
    return rules.map((rule) => rule.getAPIRule());
  }
  getAPIType(): APIConfigType {
    return APIConfigType.DYNAMIC_CONFIG;
  }
  getIsDeviceBased(): boolean {
    return false;
  }
  getIDType(): string {
    return this.config.idType;
  }
  getAPIEntity(): APIEntityType {
    return APIEntityType.DYNAMIC_CONFIG;
  }
}
