import ConfigRule, { ConfigRuleJSON } from "../types/ConfigRule";
import { safeParseJSON } from "./safeParseJSON";

/**
 * Class for loading rules from stringified data
 */
export default abstract class ConfigRuleLoader {
  public static getRulesFromJSON(rules: ConfigRuleJSON[]): ConfigRule[] {
    return rules.map((rule) => ConfigRule.fromRuleJSON(rule));
  }

  public static getRulesFromData(data: string | undefined): ConfigRule[] {
    const rules = safeParseJSON<ConfigRuleJSON[]>(data, []);
    return this.getRulesFromJSON(rules);
  }
}
