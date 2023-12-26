export declare type ConfigSpecs = {
  dynamic_configs: Array<APIConfigSpec>;
  feature_gates: Array<APIConfigSpec>;
  layer_configs: Array<APIConfigSpec>;
  layers: Record<string, string[]>;
  has_updates: boolean;
  time: number;
}

export enum APIConfigType {
  DYNAMIC_CONFIG = 'dynamic_config',
  FEATURE_GATE = 'feature_gate',
}

export enum APIEntityType {
  AUTOTUNE = 'autotune',
  DYNAMIC_CONFIG = 'dynamic_config',
  EXPERIMENT = 'experiment',
  FEATURE_GATE = 'feature_gate',
  HOLDOUT = 'holdout',
  LAYER = 'layer',
  SEGMENT = 'segment',
}

export type APIConfigSpec = {
  name: string;
  type: APIConfigType;
  salt: string;
  defaultValue: boolean | Record<string, unknown>;
  enabled: boolean;
  rules: Array<APIConfigRule>;
  isDeviceBased: boolean;
  idType: string;
  entity: APIEntityType;
  isActive?: boolean;
};

export type APIConfigRule = {
  name: string;
  groupName?: string | null;
  passPercentage: number;
  conditions: Array<APIConfigCondition>;
  returnValue: boolean | Record<string, unknown>;
  id: string;
  salt: string;
  idType: string;
  isExperimentGroup?: boolean;
};

export type APIConfigCondition = {
  type: APIConditionType;
  targetValue: string[] | number[] | string | number | null;
  operator: APIOperatorType | null;
  field: APIFieldName | string | null;
  additionalValues: Record<string, string> | null;
  idType: string;
};

export enum APIConditionType {
  FALLBACK = 'fallback',
  PUBLIC = 'public',
  IP_BASED = 'ip_based',
  UA_BASED = 'ua_based',
  USER_FIELD = 'user_field',
  PASS_GATE = 'pass_gate',
  FAIL_GATE = 'fail_gate',
  CURRENT_TIME = 'current_time',
  ENVIRONMENT_FIELD = 'environment_field',
  USER_BUCKET = 'user_bucket',
  UNIT_ID = 'unit_id',
  JAVASCRIPT = 'javascript',
  MULTI_PASS_GATE = 'multi_pass_gate',
  MULTI_FAIL_GATE = 'multi_fail_gate',
  USER_BUCKET_ENCODED = 'user_bucket_encoded',
}

export enum APIFieldName {
  BROWSER_NAME = 'browser_name',
  BROWSER_VERSION = 'browser_version',
  OS_NAME = 'os_name',
  OS_VERSION = 'os_version',

  // user data fields
  APP_VERISON = 'appVersion',
  COUNTRY = 'country',
  EMAIL = 'email',
  USER_ID = 'userID',
  IP = 'ip',
  LOCALE = 'locale',

  // environment fields
  TIER = 'tier',
}

export enum APIOperatorType {
  ANY = 'any',
  NONE = 'none',

  GT = 'gt',
  LT = 'lt',
  LTE = 'lte',
  GTE = 'gte',

  VERSION_GT = 'version_gt',
  VERSION_LT = 'version_lt',
  VERSION_EQ = 'version_eq',

  VERSION_GTE = 'version_gte',
  VERSION_LTE = 'version_lte',

  STR_CONTAINS_ANY = 'str_contains_any',
  STR_CONTAINS_NONE = 'str_contains_none',

  AFTER = 'after',
  BEFORE = 'before',
  ON = 'on',

  IN_SEGMENT_LIST = 'in_segment_list',
  NOT_IN_SEGMENT_LIST = 'not_in_segment_list',

  EQ = 'eq',
  NEQ = 'neq',

  STR_MATCHES = 'str_matches',

  ENCODED_ANY = 'encoded_any',
}
