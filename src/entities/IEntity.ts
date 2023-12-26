import type { APIConfigRule, APIConfigType, APIEntityType } from "../types/ConfigSpecs";

export default interface IConfig {
  getIsEnabled(): boolean;
  getName(): string;
  getSalt(): string;
  getDefaultValue(): boolean | Record<string, unknown>;
  getRules(): APIConfigRule[];
  getAPIType(): APIConfigType;
  getIsDeviceBased(): boolean;
  getIDType(): string;
  getAPIEntity(): APIEntityType;
}
