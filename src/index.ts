import { z } from "zod";
import { BaseQuery, UnknownQuery } from "./builder";

export type { InferType } from "./types";

export const pipe = (filter: string): UnknownQuery => {
  return new UnknownQuery({ query: filter, schema: z.unknown() });
};

// Date helper to parse date strings
const dateSchema = z.preprocess((arg) => {
  if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
}, z.date());

pipe.string = z.string;
pipe.number = z.number;
pipe.boolean = z.boolean;
pipe.unknown = z.unknown;
pipe.null = z.null;
pipe.undefined = z.undefined;
pipe.date = () => dateSchema;
pipe.literal = z.literal;
pipe.union = z.union;
pipe.array = z.array;

// Our main export is the pipe, renamed as q
export const q = pipe;

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
