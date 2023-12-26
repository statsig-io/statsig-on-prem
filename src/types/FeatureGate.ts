import { APIEntityType } from "./ConfigSpecs";

export declare type FeatureGate = {
  name: string;
  salt: string;
} & FeatureGateMetadata;

export declare type FeatureGateMetadata = {
  enabled: boolean;
};
