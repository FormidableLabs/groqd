import { z } from "zod";
import { BaseQuery, UnknownQuery } from "./builder";
import { imageRef } from "./imageHelpers";
import { schemas } from "./schemas";

export type { InferType } from "./types";

export const pipe = (filter: string): UnknownQuery => {
  return new UnknownQuery({ query: filter });
};

pipe.imageRef = imageRef;

// Add schemas
Object.assign(pipe, schemas);
type Pipe = typeof pipe & typeof schemas;

// Our main export is the pipe, renamed as q
export const q = pipe as Pipe;

type QueryExecutor = (query: string) => Promise<any>;

/**
 * Utility to create a "query runner" that consumes the result of the `q` function.
 */
type BaseType<T = any> = z.ZodType<T>;
export const makeSafeQueryRunner =
  (fn: QueryExecutor) =>
  <T extends BaseType>({ query, schema }: BaseQuery<T>): Promise<z.infer<T>> =>
    fn(query).then((res) => schema.parse(res));

/**
 * Export zod for convenience
 */
export { z };
