export declare type Experiment = {
  name: string;
  salt: string;
  idType: string;
  targetApps: Set<string>;
} & ExperimentMetadata;

export declare type ExperimentMetadata = {
  defaultValue: Record<string, unknown>;
  groups: ExperimentGroup[];
  started: boolean;
  enabled: boolean;
};

export declare type ExperimentGroup = {
  name: string;
  parameters: Record<string, unknown>;
};

export type ExperimentCreationArgs = {
  targetApps?: string[];
  idType?: string;
} & ExperimentMetadata;

export type ExperimentUpdateArgs = Partial<ExperimentCreationArgs>;
