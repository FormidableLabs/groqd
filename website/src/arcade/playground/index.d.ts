declare module "playground" {
  import type { infer, ZodType, ZodNumber } from "zod";
  import type { BaseQuery } from "groqd";

  export const runQuery: <T extends any>(
    query: { schema: ZodType<T>; query: string },
    params?: Record<string, string | number>
  ) => T;
}
