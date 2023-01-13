import { z } from "zod";
import { BaseQuery } from "./builder";

export type ValueOf<T> = T[keyof T];

export type InferType<P> = P extends BaseQuery<infer T>
  ? T extends z.ZodType
    ? z.infer<T>
    : never
  : never;
