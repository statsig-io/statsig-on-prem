import type {
  DynamicConfig,
  DynamicConfigMetadata,
} from "../types/DynamicConfig";
import type { Experiment, ExperimentMetadata } from "../types/Experiment";
import type { FeatureGate, FeatureGateMetadata } from "../types/FeatureGate";
import { EntityNames } from "../types/EntityNames";

/**
 * An interface to interacting with Statsig feature gates, experiments, and dynamic config
 */
export interface StatsigInterface {
  /**
   * Get a gate
   * @param name Name of the gate
   */
  getGate(name: string): Promise<FeatureGate | null>;
  /**
   * Create a gate
   * @param name Name of the gate
   * @param metadata properties of the gate
   */
  createGate(name: string, metadata: FeatureGateMetadata): Promise<void>;
  /**
   * Update a gate
   * @param name Name of the gate
   * @param metadata properties of the gate
   */
  updateGate(name: string, metadata: FeatureGateMetadata): Promise<void>;
  /**
   * Delete a gate
   * @param name Name of the gate
   */
  deleteGate(name: string): Promise<void>;

  /**
   * Get an experiment
   * @param name Name of the experiment
   */
  getExperiment(name: string): Promise<Experiment | null>;
  /**
   * Create an experiment
   * @param name Name of the experiment
   * @param metadata properties of the experiment
   */
  createExperiment(name: string, metadata: ExperimentMetadata): Promise<void>;
  /**
   * Update an experiment
   * @param name Name of the experiment
   * @param metadata properties of the experiment
   */
  updateExperiment(name: string, metadata: ExperimentMetadata): Promise<void>;
  /**
   * Delete an experiment
   * @param name Name of the experiment
   */
  deleteExperiment(name: string): Promise<void>;
  /**
   * Start an experiment
   * @param name Name of the experiment
   */
  startExperiment(name: string): Promise<void>;

  /**
   * Get a dynamic config
   * @param name Name of the dynamic config
   */
  getConfig(name: string): Promise<DynamicConfig | null>;
  /**
   * Create a dynamic config
   * @param name Name of the dynamic config
   * @param metadata properties of the dynamic config
   */
  createConfig(name: string, metadata: DynamicConfigMetadata): Promise<void>;
  /**
   * Update a dynamic config
   * @param name Name of the dynamic config
   * @param metadata properties of the dynamic config
   */
  updateConfig(name: string, metadata: DynamicConfigMetadata): Promise<void>;
  /**
   * Delete a dynamic config
   * @param name Name of the dynamic config
   */
  deleteConfig(name: string): Promise<void>;

  /**
   * Create a target app with an initial set of gates, experiments, configs
   * @param name Name of the target app
   * @param entities Names of gates, configs, experiments
   */
  createTargetApp(name: string, entities: EntityNames): Promise<void>;
  /**
   * Update a target app with a new set of gates, experiments, configs
   * @param name Name of the target app
   * @param entities Names of gates, configs, experiments
   */
  updateTargetApp(name: string, entities: EntityNames): Promise<void>;
  /**
   * Delete a target app and remove it from all SDK keys
   * @param name Name of the target app
   */
  deleteTargetApp(name: string): Promise<void>;
  /**
   * Add entities to an existing target app
   * @param targetApp Name of the target app
   * @param entities Names of gates, configs, experiments
   */
  addEntitiesToTargetApp(
    targetApp: string,
    entities: EntityNames
  ): Promise<void>;
  /**
   * Remove entities from an existing target app
   * @param targetApp Name of the target app
   * @param entities Names of gates, configs, experiments
   */
  removeEntitiesFromTargetApp(
    targetApp: string,
    entities: EntityNames
  ): Promise<void>;
  /**
   * Assign an existing target app to an SDK key
   * @param targetApp Name of the target app
   * @param sdkKey SDK key to assign the target app to
   */
  assignTargetAppToSDKKey(targetApp: string, sdkKey: string): Promise<void>;
  /**
   * Remove an existing target app from an SDK key
   * @param sdkKey SDK key to clear any target app previously assigned
   */
  clearTargetAppFromSDKKey(sdkKey: string): Promise<void>;

  /**
   * Register an SDK key as a valid key.
   * Only registered keys will be allowed to fetch config specs
   * @param sdkKey SDK key to register
   */
  registerSDKKey(sdkKey: string): Promise<void>;
  /**
   * Deactivate an SDK key.
   * @param sdkKey SDK key to deactivate
   */
  deactivateSDKKey(sdkKey: string): Promise<void>;
}
