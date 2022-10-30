import { z } from "zod";

export type BaseResult<T> = {
  query: string;
  schema: T;
};

export type Field<T extends z.ZodType> = T;

export type FromField<T> = T extends Field<infer R> ? R : never;
