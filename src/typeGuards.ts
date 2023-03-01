import { z } from "zod";
import { BaseQuery } from "./builder";

export function extendsBaseQuery<T>(
  v: T
): v is T extends BaseQuery<any> ? T : never {
  return v instanceof BaseQuery;
}

export function isQuerySchemaTuple<T>(
  v: T
): v is T extends [string, z.ZodType] ? T : never {
  return Array.isArray(v);
}
