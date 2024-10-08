import {
  APIConditionType,
  APIFieldName,
  APIOperatorType,
} from "../ConfigSpecs";
import ConfigCondition, {
  ConfigConditionType,
  SupportedOperations,
} from "./ConfigCondition";
import { z } from "zod";
import { OmitUndefined } from "../../utils/types";

const AllowedOperators = z.union([
  z.literal(APIOperatorType.ANY),
  z.literal(APIOperatorType.NONE),
  z.literal(APIOperatorType.EQ),
  z.literal(APIOperatorType.NEQ),
  z.literal(APIOperatorType.STR_CONTAINS_ANY),
  z.literal(APIOperatorType.STR_CONTAINS_NONE),
  z.literal(APIOperatorType.STR_STARTS_WITH_ANY),
  z.literal(APIOperatorType.STR_ENDS_WITH_ANY),
  z.literal(APIOperatorType.LT),
  z.literal(APIOperatorType.LTE),
  z.literal(APIOperatorType.GT),
  z.literal(APIOperatorType.GTE),
  z.literal(APIOperatorType.VERSION_LT),
  z.literal(APIOperatorType.VERSION_LTE),
  z.literal(APIOperatorType.VERSION_GT),
  z.literal(APIOperatorType.VERSION_GTE),
  z.literal(APIOperatorType.VERSION_EQ),
  z.literal(APIOperatorType.ON),
  z.literal(APIOperatorType.AFTER),
  z.literal(APIOperatorType.BEFORE),
  z.literal(APIOperatorType.STR_MATCHES),
]);
const AllowedValues = z.union([
  z.string(),
  z.string().array(),
  z.number(),
  z.number().array(),
  z.null(),
]);
const AllowedFields = z.union([z.nativeEnum(APIFieldName), z.string()]);

export const CustomFieldConditionInputSchema = SupportedOperations(
  AllowedOperators,
  AllowedValues,
  AllowedFields
);

export type CustomFieldConditionInput = OmitUndefined<
  z.infer<typeof CustomFieldConditionInputSchema>
>;

export default class ConfigCustomFieldCondition extends ConfigCondition {
  protected operator: z.infer<typeof AllowedOperators>;
  protected targetValue: z.infer<typeof AllowedValues>;
  protected field: APIFieldName | string;

  constructor(input: CustomFieldConditionInput) {
    super();
    CustomFieldConditionInputSchema.parse(input);
    this.operator = input.operator;
    this.field = input.field;
    this.targetValue = input.targetValue;
  }

  public getConfigConditionType(): ConfigConditionType {
    return ConfigConditionType.CUSTOM_FIELD;
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

  public getField(): APIFieldName | string {
    return this.field;
  }

  public getTargetValue(): string | string[] | number | number[] | null {
    return this.targetValue;
  }
}
