import { z } from "zod";
import { OmitUndefined } from "../../utils/types";
import {
  APIConditionType,
  APIOperatorType,
  APIFieldName,
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
  z.literal(APIFieldName.USER_ID) /* From JSON */,
]);

export const UserIDConditionInputSchema = SupportedOperations(
  AllowedOperators,
  AllowedValues,
  AllowedFields
);

export type UserIDConditionInput = OmitUndefined<
  z.infer<typeof UserIDConditionInputSchema>
>;

export default class ConfigUserIDCondition extends ConfigCondition {
  protected operator: z.infer<typeof AllowedOperators>;
  protected targetValue: z.infer<typeof AllowedValues>;

  constructor(input: UserIDConditionInput) {
    super();
    UserIDConditionInputSchema.parse(input);
    this.operator = input.operator;
    this.targetValue = input.targetValue;
  }

  public getConfigConditionType(): ConfigConditionType {
    return ConfigConditionType.USER_ID;
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
    return APIFieldName.USER_ID;
  }

  public getTargetValue(): string | string[] | null {
    return this.targetValue;
  }
}
