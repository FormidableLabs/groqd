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
        if (e instanceof z.ZodError) throw new GroqdParseError(e, res);
        throw e;
      }
    });

export class GroqdParseError extends Error {
  readonly zodError: z.ZodError;
  readonly rawResponse: unknown;

  // zodError: z.ZodError;
  constructor(public readonly err: z.ZodError, rawResponse: unknown) {
    const errorMessages = err.errors.map(
      (e) =>
        `\t\`result${e.path.reduce((acc, el) => {
          if (typeof el === "string") {
            return `${acc}.${el}`;
          }
          return `${acc}[${el}]`;
        }, "")}\`: ${e.message}`
    );

    super(`Error parsing:\n${errorMessages.join("\n")}`);
    this.zodError = err;
    this.rawResponse = rawResponse;
  }
}

type BaseType<T = any> = z.ZodType<T>;
type ButFirst<T extends unknown[]> = T extends [unknown, ...infer U]
  ? U
  : never;
