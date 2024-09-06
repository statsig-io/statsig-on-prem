import { APIConditionType } from "../ConfigSpecs";
import ConfigCondition, { ConfigConditionType } from "./ConfigCondition";

export default class ConfigPublicCondition extends ConfigCondition {
  public getConfigConditionType(): ConfigConditionType {
    return ConfigConditionType.PUBLIC;
  }

  public getAPIConditionType(): APIConditionType {
    return APIConditionType.PUBLIC;
  }

  public getIDType(): string {
    return "userID";
  }

  public getOperator(): null {
    return null;
  }

  public getField(): null {
    return null;
  }

  public getTargetValue(): null {
    return null;
  }
}
