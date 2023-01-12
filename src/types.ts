import { z } from "zod";
import { BaseResult } from "./builder";

export type ValueOf<T> = T[keyof T];

export type InferType<P> = P extends BaseResult<infer T>
  ? T extends z.ZodType
    ? z.infer<T>
    : never
  : never;
