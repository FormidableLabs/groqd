import { BaseResult } from "./types";
import { z } from "zod";

export const deref =
  () =>
  <T extends z.ZodUnknown | z.ZodArray<z.ZodUnknown>>(prev: BaseResult<T>) => {
    return {
      query: prev.query + "->",
      schema: prev.schema,
    } as BaseResult<T>;
  };
