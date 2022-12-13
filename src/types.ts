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
