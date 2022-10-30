import { z } from "zod";
import { BaseResult } from "./types";

export const filter =
  (filterValue = "") =>
  <T>(prev: BaseResult<T>) => {
    type NewType = T extends z.ZodArray<any> ? T : z.ZodArray<z.ZodUnknown>;
    const schema =
      prev.schema instanceof z.ZodArray ? prev.schema : z.array(z.unknown());

    return {
      __type: "filter",
      query: prev.query + `[${filterValue}]`,
      schema: schema,
    } as BaseResult<NewType>;
  };
