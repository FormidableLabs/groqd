import { z } from "zod";

export type BaseResult<T> = {
  query: string;
  schema: T;
};

export type InferType<Result> = Result extends BaseResult<infer T>
  ? T extends z.ZodType
    ? z.infer<T>
    : never
  : never;

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
export type ValueOf<T> = T[keyof T];

export type AllOrNothing<T> = T | Partial<Record<keyof T, undefined>>;
