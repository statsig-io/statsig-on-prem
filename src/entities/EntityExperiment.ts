import {
  APIConditionType,
  APIConfigRule,
  APIConfigType,
  APIEntityType,
  APIOperatorType,
} from "../types/ConfigSpecs";
import { Experiment } from "../types/Experiment";
import IEntity from "./IEntity";

export default class EntityExperiment implements IEntity {
  public constructor(private experiment: Experiment) {}
  getIsEnabled(): boolean {
    return this.experiment.enabled;
  }
  getName(): string {
    return this.experiment.name;
  }
  getSalt(): string {
    return this.experiment.salt;
  }
  getDefaultValue(): Record<string, unknown> {
    return this.experiment.defaultValue;
  }
  getRules(): APIConfigRule[] {
    const bucketSize = 1000 / this.experiment.groups.length;
    return this.experiment.groups.map((group, index) => {
      return {
        name: `rule-${index}`,
        groupName: group.name,
        passPercentage: 100,
        conditions: [
          {
            type: APIConditionType.USER_BUCKET,
            targetValue: bucketSize * index,
            operator: APIOperatorType.LT,
            field: null,
            additionalValues: {
              salt: this.experiment.salt,
            },
            idType: this.getIDType(),
          },
        ],
        returnValue: group.parameters,
        id: `rule-${index}`,
        salt: `rule-${index}`,
        idType: this.getIDType(),
        isExperimentGroup: true,
      };
    });
  }
  getAPIType(): APIConfigType {
    return APIConfigType.DYNAMIC_CONFIG;
  }
  getIsDeviceBased(): boolean {
    return false;
  }
  getIDType(): string {
    return this.experiment.idType;
  }
  getAPIEntity(): APIEntityType {
    return APIEntityType.EXPERIMENT;
  }
  getIsActive(): boolean {
    return this.experiment.started;
  }
}
