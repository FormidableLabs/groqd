import { BaseResult } from "./types";

export const deref =
  () =>
  <T>(prev: BaseResult<T>) => {
    return {
      query: prev.query + "->",
      schema: prev.schema,
    } as BaseResult<T>;
  };
