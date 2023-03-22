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
        if (e instanceof z.ZodError) {
          const errorPath = `result${e.errors[0].path.reduce((acc, el) => {
            if (typeof el === "string") {
              return `${acc}.${el}`;
            }
            return `${acc}[${el}]`;
          }, "")}`;

          throw new GroqdParseError(
            `Error parsing \`${errorPath}\`: ${e.errors[0].message}.`,
            e
          );
        }

        throw e;
      }
    });

export class GroqdParseError extends Error {
  zodError: z.ZodError;
  constructor(public readonly message: string, zodError: z.ZodError) {
    super(message);
    this.zodError = zodError;
  }
}

type BaseType<T = any> = z.ZodType<T>;
type ButFirst<T extends unknown[]> = T extends [unknown, ...infer U]
  ? U
  : never;
