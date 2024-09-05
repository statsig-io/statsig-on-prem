import StatsigOnPrem from "./src/StatsigOnPrem";
import StatsigStorageExample from "./examples/StatsigStorageExample";
import { StatsigInterface } from "./src/interfaces/StatsigInterface";
import { StorageInterface } from "./src/interfaces/StorageInterface";
import { ConfigSpecs } from "./src/types/ConfigSpecs";
import { TargetAppNames } from "./src/types/TargetAppNames";
import { APIOperatorType, APIFieldName } from "./src/types/ConfigSpecs";
import { ConfigConditionType } from "./src/types/conditions/ConfigCondition";

export {
  StatsigStorageExample,
  StatsigInterface,
  StorageInterface,
  ConfigSpecs,
  TargetAppNames,
  APIOperatorType,
  APIFieldName,
  ConfigConditionType,
};

export default StatsigOnPrem;
