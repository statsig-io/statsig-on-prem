import ConfigConditionLoader from "../utils/ConfigConditionLoader";
import ConfigCondition, {
  ConfigConditionJSON,
} from "./conditions/ConfigCondition";
import { APIConfigRule } from "./ConfigSpecs";

export type ConfigRuleJSON = {
  id: string;
  name: string;
  conditions: ConfigConditionJSON[];
  passPercentage: number;
  returnValue: boolean | Record<string, unknown>;
  salt: string;
  idType: string;
};

export default class ConfigRule {
  private constructor(
    public id: string,
    public name: string,
    public conditions: ConfigCondition[],
    public passPercentage: number,
    public returnValue: boolean | Record<string, unknown>,
    public salt: string,
    public idType: string
  ) {}

  public static new(input: {
    id: string;
    name: string;
    conditions: ConfigCondition[];
    passPercentage: number;
    returnValue: boolean | Record<string, unknown>;
    salt: string;
    idType: string;
  }): ConfigRule {
    return new ConfigRule(
      input.id,
      input.name,
      input.conditions,
      input.passPercentage,
      input.returnValue,
      input.salt,
      input.idType
    );
  }

  public getAPIRule(): APIConfigRule {
    return {
      id: this.id,
      name: this.name,
      conditions: this.conditions.map((c) => c.getAPICondition()),
      passPercentage: this.passPercentage,
      returnValue: this.returnValue,
      salt: this.salt,
      idType: this.idType,
    };
  }

  public getRuleJSON(): ConfigRuleJSON {
    return {
      id: this.id,
      name: this.name,
      conditions: this.conditions.map((c) => c.getConditionJSON()),
      passPercentage: this.passPercentage,
      returnValue: this.returnValue,
      salt: this.salt,
      idType: this.idType,
    };
  }

  public static fromRuleJSON(rule: ConfigRuleJSON): ConfigRule {
    return new ConfigRule(
      rule.id,
      rule.name,
      ConfigConditionLoader.getConditionsFromJSON(rule.conditions),
      rule.passPercentage,
      rule.returnValue,
      rule.salt,
      rule.idType
    );
  }
}
