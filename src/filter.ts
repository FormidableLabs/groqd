import { z } from "zod";
import { BaseResult } from "./types";

export const filter =
  (filterValue: string) =>
  <T>(prev: BaseResult<T>) => {
    type NewType = T extends z.ZodArray<any> ? T : z.ZodNull;
    const schema = prev.schema instanceof z.ZodArray ? prev.schema : z.null();

    return {
      __type: "filter",
      query: prev.query + `[${filterValue}]`,
      schema: schema,
    } as BaseResult<NewType>;
  };
