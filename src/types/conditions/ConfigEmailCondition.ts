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
  z.literal(APIOperatorType.STR_MATCHES),
]);
const AllowedValues = z.union([z.string(), z.string().array(), z.null()]);
const AllowedFields = z.union([
  z.undefined() /* From input */,
  z.literal(APIFieldName.EMAIL) /* From JSON */,
]);

export const EmailConditionInputSchema = SupportedOperations(
  AllowedOperators,
  AllowedValues,
  AllowedFields
);

export type EmailConditionInput = OmitUndefined<
  z.infer<typeof EmailConditionInputSchema>
>;

export default class ConfigEmailCondition extends ConfigCondition {
  protected operator: z.infer<typeof AllowedOperators>;
  protected targetValue: z.infer<typeof AllowedValues>;

  constructor(input: EmailConditionInput) {
    super();
    EmailConditionInputSchema.safeParse(input);
    this.operator = input.operator;
    this.targetValue = input.targetValue;
  }

  public getConfigConditionType(): ConfigConditionType {
    return ConfigConditionType.EMAIL;
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
    return APIFieldName.EMAIL;
  }

  public getTargetValue(): string | string[] | null {
    return this.targetValue;
  }
}
