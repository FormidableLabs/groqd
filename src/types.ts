import { z } from "zod";

export type BaseResult<T> = {
  query: string;
  schema: T;
};

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

export type Field<T extends z.ZodType> = { name: string; schema: T };
export type FromField<T> = T extends Field<infer R> ? R : never;
