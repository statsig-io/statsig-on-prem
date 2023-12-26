import {
  APIConditionType,
  APIConfigRule,
  APIConfigType,
  APIEntityType,
} from "../types/ConfigSpecs";
import { FeatureGate } from "../types/FeatureGate";
import IEntity from "./IEntity";

export default class EntityFeatureGate implements IEntity {
  public constructor(private gate: FeatureGate) {}
  getIsEnabled(): boolean {
    return this.gate.enabled;
  }
  getName(): string {
    return this.gate.name;
  }
  getSalt(): string {
    return this.gate.salt;
  }
  getDefaultValue(): boolean {
    return false;
  }
  getRules(): APIConfigRule[] {
    return [
      {
        name: "rule1",
        passPercentage: 100,
        conditions: [
          {
            type: APIConditionType.PUBLIC,
            targetValue: null,
            operator: null,
            field: null,
            additionalValues: {},
            idType: "userID",
          },
        ],
        returnValue: true,
        id: "rule1",
        salt: "rule1",
        idType: "userID",
      },
    ];
  }
  getAPIType(): APIConfigType {
    return APIConfigType.FEATURE_GATE;
  }
  getIsDeviceBased(): boolean {
    return false;
  }
  getIDType(): string {
    return "userID";
  }
  getAPIEntity(): APIEntityType {
    return APIEntityType.FEATURE_GATE;
  }
}
