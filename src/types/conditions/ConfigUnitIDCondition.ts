import { z } from "zod";
import { OmitUndefined } from "../../utils/types";
import { APIConditionType, APIOperatorType } from "../ConfigSpecs";
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
const AllowedFields = z.string();

export const UnitIDConditionInputSchema = SupportedOperations(
  AllowedOperators,
  AllowedValues,
  AllowedFields
);

export type UnitIDConditionInput = OmitUndefined<
  z.infer<typeof UnitIDConditionInputSchema>
>;

export default class ConfigUnitIDCondition extends ConfigCondition {
  protected operator: z.infer<typeof AllowedOperators>;
  protected targetValue: z.infer<typeof AllowedValues>;
  protected field: string;

  constructor(input: UnitIDConditionInput) {
    super();
    UnitIDConditionInputSchema.parse(input);
    this.operator = input.operator;
    this.field = input.field;
    this.targetValue = input.targetValue;
  }

  public getConfigConditionType(): ConfigConditionType {
    return ConfigConditionType.UNIT_ID;
  }

  public getAPIConditionType(): APIConditionType {
    return APIConditionType.UNIT_ID;
  }

  public getIDType(): string {
    return this.field;
  }

  public getOperator(): APIOperatorType {
    return this.operator;
  }

  public getField(): string {
    return this.field;
  }

  public getTargetValue(): string | string[] | null {
    return this.targetValue;
  }
}
