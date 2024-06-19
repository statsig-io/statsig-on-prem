export declare type DynamicConfig = {
  name: string;
  salt: string;
  idType: string;
  targetApps: Set<string>;
} & DynamicConfigMetadata;

export declare type DynamicConfigMetadata = {
  defaultValue: Record<string, unknown>;
  enabled: boolean;
};

export type DynamicConfigCreationArgs = {
  targetApps?: string[];
  idType?: string;
} & DynamicConfigMetadata;

export type DynamicConfigUpdateArgs = Partial<DynamicConfigCreationArgs>;
