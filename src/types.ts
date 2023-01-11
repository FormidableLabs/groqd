import { z } from "zod";
import { PipeBase } from "./builder";

export type BaseResult<T> = {
  query: string;
  schema: T;
};

export type ValueOf<T> = T[keyof T];

export type InferType<P> = P extends PipeBase<infer T>
  ? T extends z.ZodType
    ? z.infer<T>
    : never
  : never;
