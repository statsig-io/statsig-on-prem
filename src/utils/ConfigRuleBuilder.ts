import ConfigRule from "../types/ConfigRule";
import type { DynamicConfig } from "../types/DynamicConfig";
import ConfigConditionLoader, {
  ConfigConditionInput,
} from "./ConfigConditionLoader";
import ConfigRuleLoader from "./ConfigRuleLoader";
import HashUtils from "./HashUtils";
import { IDUtils } from "./IDUtils";
import LinkedList from "./LinkedList";

/**
 * External interface for mutating the rules of a config
 */
export default class ConfigRuleBuilder {
  private rules: LinkedList<ConfigRule>;

  constructor(config: DynamicConfig) {
    const rules = ConfigRuleLoader.getRulesFromData(config.rulesJSON);
    this.rules = new LinkedList(rules);
  }

  public addRule(input: {
    name: string;
    conditions: ConfigConditionInput[];
    value: boolean | Record<string, unknown>;
    passPercentage: number;
    idType: string;
  }): ConfigRule {
    const rule = ConfigRule.new({
      name: input.name,
      passPercentage: input.passPercentage,
      conditions: input.conditions.map((c) =>
        ConfigConditionLoader.getConditionFromInput(c)
      ),
      returnValue: input.value,
      id: HashUtils.hashString(input.name),
      salt: IDUtils.generateNewSalt(),
      idType: input.idType,
    });
    this.rules.add(rule);
    return rule;
  }

  public updateRule(rule: ConfigRule): void {
    this.rules.update(rule);
  }

  public deleteRule(rule: ConfigRule): void {
    this.rules.delete(rule);
  }

  public moveRuleUp(rule: ConfigRule): void {
    const prev = this.rules.getPrev(rule);
    if (prev) {
      this.rules.swap(prev, rule);
    }
  }

  public moveRuleDown(rule: ConfigRule): void {
    const next = this.rules.getNext(rule);
    if (next) {
      this.rules.swap(next, rule);
    }
  }

  public swapRules(ruleA: ConfigRule, ruleB: ConfigRule): void {
    this.rules.swap(ruleA, ruleB);
  }

  public getRules(): ConfigRule[] {
    return this.rules.toArray();
  }

  public getRulesJSON(): string {
    const rulesJSON = this.getRules().map((rule) => rule.getRuleJSON());
    return JSON.stringify(rulesJSON);
  }
}
