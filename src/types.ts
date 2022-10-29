import { z } from "zod";

export type BaseResult<T> = {
  query: string;
  schema: T;
};

export type Field<T extends z.ZodType> = {
  name: string;
  schema: T;
  mod: <N extends z.ZodType>(arg: (x: T) => N) => Field<N>;
};
export type FromField<T> = T extends Field<infer R> ? R : never;
