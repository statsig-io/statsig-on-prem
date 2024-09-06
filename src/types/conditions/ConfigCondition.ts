import {
  APIConditionType,
  APIConfigCondition,
  APIFieldName,
  APIOperatorType,
} from "../ConfigSpecs";
import { z } from "zod";

const MultiTypes = z.union([
  z.string().array().nullable(),
  z.number().array().nullable(),
  z.null(),
]);

const SingleTypes = z.union([z.string(), z.number(), z.null()]);

const MultiValue = <T extends z.ZodTypeAny>(type: T) =>
  type.refine(
    (t) => MultiTypes.safeParse(t).success,
    `Expected array of strings or numbers.`
  );

const SingleValue = <T extends z.ZodTypeAny>(type: T) =>
  type.refine(
    (t) => SingleTypes.safeParse(t).success,
    "Expected string or number."
  );

export function SupportedOperations<
  O extends z.ZodTypeAny,
  V extends z.ZodTypeAny,
  F extends z.ZodTypeAny
>(operators: O, targetValue: V, field: F) {
  return z
    .union([
      z.object({
        operator: z.literal(APIOperatorType.ANY),
        targetValue: MultiValue(targetValue),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.NONE),
        targetValue: MultiValue(targetValue),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.EQ),
        targetValue: SingleValue(targetValue),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.NEQ),
        targetValue: SingleValue(targetValue),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.STR_CONTAINS_ANY),
        targetValue: z.string().array(),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.STR_CONTAINS_NONE),
        targetValue: z.string().array(),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.STR_MATCHES),
        targetValue: z.string(),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.LT),
        targetValue: z.number(),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.LTE),
        targetValue: z.number(),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.GT),
        targetValue: z.number(),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.GTE),
        targetValue: z.number(),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.VERSION_LT),
        targetValue: SingleValue(targetValue),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.VERSION_LTE),
        targetValue: SingleValue(targetValue),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.VERSION_GT),
        targetValue: SingleValue(targetValue),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.VERSION_GTE),
        targetValue: SingleValue(targetValue),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.VERSION_EQ),
        targetValue: SingleValue(targetValue),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.ON),
        targetValue: z.number(),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.AFTER),
        targetValue: z.number(),
        field: field,
      }),
      z.object({
        operator: z.literal(APIOperatorType.BEFORE),
        targetValue: z.number(),
        field: field,
      }),
    ])
    .refine(
      (
        data
      ): data is {
        operator: z.infer<typeof operators>;
        targetValue: z.infer<typeof targetValue>;
        field: z.infer<typeof field>;
      } => operators.safeParse(data.operator).success
    );
}

export enum ConfigConditionType {
  PUBLIC = "public",
  CUSTOM_FIELD = "custom_field",
  EMAIL = "email",
  LOCALE = "locale",
  UNIT_ID = "unit_id",
  USER_ID = "user_id",
}

export type ConfigConditionJSON = {
  type: ConfigConditionType;
  operator: APIOperatorType | null;
  field: string | APIFieldName | null;
  targetValue: string[] | number[] | string | number | null;
};

export default abstract class ConfigCondition {
  public abstract getConfigConditionType(): ConfigConditionType;
  public abstract getAPIConditionType(): APIConditionType;
  public abstract getIDType(): string;
  public abstract getOperator(): APIOperatorType | null;
  public abstract getField(): APIFieldName | string | null;
  public abstract getTargetValue():
    | string[]
    | number[]
    | string
    | number
    | null;

  // Schematized for SDK evaluation
  public getAPICondition(): APIConfigCondition {
    return {
      type: this.getAPIConditionType(),
      targetValue: this.getTargetValue(),
      operator: this.getOperator(),
      field: this.getField(),
      additionalValues: null,
      idType: this.getIDType(),
    };
  }

  // Schematized for storage
  public getConditionJSON(): ConfigConditionJSON {
    return {
      type: this.getConfigConditionType(),
      targetValue: this.getTargetValue(),
      operator: this.getOperator(),
      field: this.getField(),
    };
  }
}
