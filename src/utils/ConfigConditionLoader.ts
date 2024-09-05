import { ExhaustSwitchError } from "../Errors";
import ConfigCondition, {
  ConfigConditionJSON,
  ConfigConditionType,
} from "../types/conditions/ConfigCondition";
import ConfigCustomFieldCondition, {
  CustomFieldConditionInput,
  CustomFieldConditionInputSchema,
} from "../types/conditions/ConfigCustomFieldCondition";
import ConfigEmailCondition, {
  EmailConditionInput,
  EmailConditionInputSchema,
} from "../types/conditions/ConfigEmailCondition";
import ConfigLocaleCondition, {
  LocaleConditionInput,
  LocaleConditionInputSchema,
} from "../types/conditions/ConfigLocaleCondition";
import ConfigUnitIDCondition, {
  UnitIDConditionInput,
  UnitIDConditionInputSchema,
} from "../types/conditions/ConfigUnitIDCondition";
import ConfigUserIDCondition, {
  UserIDConditionInput,
  UserIDConditionInputSchema,
} from "../types/conditions/ConfigUserIDCondition";
import { filterNulls } from "./filterNulls";
import { safeParseJSON } from "./safeParseJSON";

export type ConfigConditionInput =
  | { type: ConfigConditionType.CUSTOM_FIELD; input: CustomFieldConditionInput }
  | { type: ConfigConditionType.EMAIL; input: EmailConditionInput }
  | { type: ConfigConditionType.LOCALE; input: LocaleConditionInput }
  | { type: ConfigConditionType.UNIT_ID; input: UnitIDConditionInput }
  | { type: ConfigConditionType.USER_ID; input: UserIDConditionInput };

/**
 * Class for defining new conditions and loading conditions from stringified data
 * with schema validation on both the Javascript input and JSON data
 */
export default abstract class ConfigConditionLoader {
  /**
   * Creates a new ConfigCondition that meets criteria using static typing
   * @param args The type of condition and the allowed inputs
   * @returns A new ConfigCondition
   */
  public static getConditionFromInput(
    args: ConfigConditionInput
  ): ConfigCondition {
    const { type, input } = args;
    switch (type) {
      case ConfigConditionType.CUSTOM_FIELD:
        return new ConfigCustomFieldCondition(input);
      case ConfigConditionType.EMAIL:
        return new ConfigEmailCondition(input);
      case ConfigConditionType.LOCALE:
        return new ConfigLocaleCondition(input);
      case ConfigConditionType.UNIT_ID:
        return new ConfigUnitIDCondition(input);
      case ConfigConditionType.USER_ID:
        return new ConfigUserIDCondition(input);
      default:
        throw new ExhaustSwitchError(type);
    }
  }

  /**
   * Revives the original ConfigCondition from it's JSON representation using
   * dynamic typing to validate the criteria.
   * @param condition The JSON representation of the condition
   * @returns A new ConfigCondition
   */
  private static getConditionFromJSON(
    condition: ConfigConditionJSON
  ): ConfigCondition | null {
    const input = this.validateAndParseInputFromJSON(condition);
    if (!input) {
      return null;
    }
    return this.getConditionFromInput(input);
  }

  public static getConditionsFromJSON(
    conditions: ConfigConditionJSON[]
  ): ConfigCondition[] {
    return filterNulls(conditions.map((c) => this.getConditionFromJSON(c)));
  }

  public static getConditionsFromData(data: string): ConfigCondition[] {
    const conditions = safeParseJSON<ConfigConditionJSON[]>(data, []);
    return this.getConditionsFromJSON(conditions);
  }

  private static validateAndParseInputFromJSON(
    condition: ConfigConditionJSON
  ): ConfigConditionInput | null {
    try {
      const { type, ...input } = condition;
      switch (type) {
        case ConfigConditionType.CUSTOM_FIELD:
          return { type, input: CustomFieldConditionInputSchema.parse(input) };
        case ConfigConditionType.EMAIL:
          return { type, input: EmailConditionInputSchema.parse(input) };
        case ConfigConditionType.LOCALE:
          return { type, input: LocaleConditionInputSchema.parse(input) };
        case ConfigConditionType.UNIT_ID:
          return { type, input: UnitIDConditionInputSchema.parse(input) };
        case ConfigConditionType.USER_ID:
          return { type, input: UserIDConditionInputSchema.parse(input) };
        default:
          throw new ExhaustSwitchError(type);
      }
    } catch (e) {
      console.log(
        `Unable to parse config condition data: ${JSON.stringify(
          condition
        )}: ${JSON.stringify(e)}`
      );
      return null;
    }
  }
}
