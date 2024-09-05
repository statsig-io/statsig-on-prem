import { z } from "zod";
import { OmitUndefined } from "../../utils/types";
import {
  APIConditionType,
  APIFieldName,
  APIOperatorType,
} from "../ConfigSpecs";
import ConfigCondition, {
  ConfigConditionType,
  SupportedOperations,
} from "./ConfigCondition";

const AllowedOperators = z.union([
  z.literal(APIOperatorType.ANY),
  z.literal(APIOperatorType.NONE),
  z.literal(APIOperatorType.EQ),
  z.literal(APIOperatorType.NEQ),
  z.literal(APIOperatorType.STR_CONTAINS_ANY),
  z.literal(APIOperatorType.STR_CONTAINS_NONE),
  z.literal(APIOperatorType.STR_STARTS_WITH_ANY),
  z.literal(APIOperatorType.STR_ENDS_WITH_ANY),
  z.literal(APIOperatorType.STR_MATCHES),
]);
const AllowedValues = z.union([z.string(), z.string().array(), z.null()]);
const AllowedFields = z.union([
  z.undefined() /* From input */,
  z.literal(APIFieldName.LOCALE) /* From JSON */,
]);

export const LocaleConditionInputSchema = SupportedOperations(
  AllowedOperators,
  AllowedValues,
  AllowedFields
);

export type LocaleConditionInput = OmitUndefined<
  z.infer<typeof LocaleConditionInputSchema>
>;

export default class ConfigLocaleCondition extends ConfigCondition {
  protected operator: z.infer<typeof AllowedOperators>;
  protected targetValue: z.infer<typeof AllowedValues>;

  constructor(input: LocaleConditionInput) {
    super();
    LocaleConditionInputSchema.parse(input);
    this.operator = input.operator;
    this.targetValue = input.targetValue;
  }

  public getConfigConditionType(): ConfigConditionType {
    return ConfigConditionType.LOCALE;
  }

  public getAPIConditionType(): APIConditionType {
    return APIConditionType.USER_FIELD;
  }

  public getIDType(): string {
    return "userID";
  }

  public getOperator(): APIOperatorType {
    return this.operator;
  }

  public getField(): string {
    return APIFieldName.LOCALE;
  }

  public getTargetValue(): string | string[] | null {
    return this.targetValue;
  }
}
