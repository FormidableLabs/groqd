import { z } from "zod";
import { BaseQuery } from "./builder";

/**
 * Utility to create a "query runner" that consumes the result of the `q` function.
 */
export const makeSafeQueryRunner =
  <Fn extends (query: string, ...rest: any[]) => Promise<any>>(fn: Fn) =>
  <T extends BaseType>(
    { query, schema }: BaseQuery<T>,
    ...rest: ButFirst<Parameters<Fn>>
  ): Promise<z.infer<T>> =>
    fn(query, ...rest).then((res) => schema.parse(res));

type BaseType<T = any> = z.ZodType<T>;
type ButFirst<T extends unknown[]> = T extends [unknown, ...infer U]
  ? U
  : never;
