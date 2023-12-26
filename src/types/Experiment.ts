import { APIEntityType } from "./ConfigSpecs";

export declare type Experiment = {
  name: string;
  salt: string;
} & ExperimentMetadata;

export declare type ExperimentMetadata = {
  defaultValue: Record<string, unknown>;
  groups: ExperimentGroup[];
  started: boolean;
  enabled: boolean;
}

export declare type ExperimentGroup = {
  name: string;
  parameters: Record<string, unknown>;
}