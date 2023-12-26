import { APIEntityType } from "./ConfigSpecs";

export declare type DynamicConfig = {
  name: string;
  salt: string;
} & DynamicConfigMetadata;

export declare type DynamicConfigMetadata = {
  defaultValue: Record<string, unknown>;
  enabled: boolean;
};
