export declare type FeatureGate = {
  name: string;
  salt: string;
  idType: string;
} & FeatureGateMetadata;

export declare type FeatureGateMetadata = {
  enabled: boolean;
};

export type FeatureGateCreationArgs = {
  targetApps?: string[];
  idType?: string;
} & FeatureGateMetadata;
