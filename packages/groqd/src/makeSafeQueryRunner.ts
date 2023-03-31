import { z } from "zod";
import { BaseQuery } from "./baseQuery";

/**
 * Utility to create a "query runner" that consumes the result of the `q` function.
 */
export const makeSafeQueryRunner =
  <Fn extends (query: string, ...rest: any[]) => Promise<any>>(fn: Fn) =>
  <T extends BaseType>(
    { query, schema }: BaseQuery<T>,
    ...rest: ButFirst<Parameters<Fn>>
  ): Promise<z.infer<T>> =>
    fn(query, ...rest).then((res) => {
      try {
        return schema.parse(res);
      } catch (e) {
        if (e instanceof z.ZodError) throw new GroqdParseError(e);
        throw e;
      }
    });

export class GroqdParseError extends Error {
  readonly zodError: z.ZodError;
  // zodError: z.ZodError;
  constructor(public readonly err: z.ZodError) {
    const errorPath = `result${err.errors[0].path.reduce((acc, el) => {
      if (typeof el === "string") {
        return `${acc}.${el}`;
      }
      return `${acc}[${el}]`;
    }, "")}`;

    super(`Error parsing \`${errorPath}\`: ${err.errors[0].message}.`);
    this.zodError = err;
  }
}

type BaseType<T = any> = z.ZodType<T>;
type ButFirst<T extends unknown[]> = T extends [unknown, ...infer U]
  ? U
  : never;
