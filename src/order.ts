import { z } from "zod";
import { BaseResult } from "./types";

export const order =
  (...args: `${string} ${"asc" | "desc"}`[]) =>
  <T>(prev: BaseResult<T>) => {
    type NewType = T extends z.ZodArray<any> ? T : z.ZodNever;
    const schema = prev.schema instanceof z.ZodArray ? prev.schema : z.never();

    return {
      __type: "order",
      query: prev.query + `|order(${args.join(", ")})`,
      schema: schema,
    } as BaseResult<NewType>;
  };
