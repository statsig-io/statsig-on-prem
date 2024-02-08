export declare type DynamicConfig = {
  name: string;
  salt: string;
  idType: string;
} & DynamicConfigMetadata;

export declare type DynamicConfigMetadata = {
  defaultValue: Record<string, unknown>;
  enabled: boolean;
};

export type DynamicConfigCreationArgs = {
  targetApps?: string[];
  idType?: string;
} & DynamicConfigMetadata;
