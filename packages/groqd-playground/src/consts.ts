export const STORAGE_KEYS = {
  DATASET: "__groqd_playground_dataset",
  API_VERSION: "__groqd_playground_api_version",
  CODE: "__groqd_playground_code",
};

export const API_VERSIONS = ["v1", "vX", "v2021-03-25", "v2021-10-21"];
export const DEFAULT_API_VERSION = API_VERSIONS.at(-1) as string;
