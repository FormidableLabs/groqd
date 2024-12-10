import { z } from "zod";
import { ParserFunction } from "../types/public-types";
import { pick } from "../types/utils";

const zodPrimitives = pick(z, [
  "string",
  "number",
  "boolean",
  "null",
  "date",
  "union",
  "array",
  "object",
]);

const zodExtras = {
  /**
   * Wraps a Zod method, but maps `null` to `undefined` first.
   */
  nullToUndefined<TZodSchema extends z.ZodType>(
    schema: TZodSchema
  ): ParserFunction<z.input<TZodSchema> | null, z.output<TZodSchema>> {
    return (input) => {
      return schema.parse(input ?? undefined);
    };
  },
  /**
   * Zod's `.default()` method doesn't work well with GROQ,
   * since GROQ only returns `null` and never `undefined`.
   *
   * So instead of chaining Zod's default method,
   * use this default method instead.
   *
   * @example
   * // Before:
   * q.number().default(0)
   * // After:
   * q.default(q.number(), 0)
   */
  default<TZodSchema extends z.ZodType<any, any, any>>(
    schema: TZodSchema,
    defaultValue: z.output<TZodSchema>
  ): ParserFunction<
    z.input<TZodSchema> | null | undefined,
    z.output<TZodSchema>
  > {
    return (input) => {
      if (input === null || input === undefined) return defaultValue;
      return schema.parse(input);
    };
  },
  /**
   * TODO
   * @param fieldName
   */
  slug<TFieldName extends string>(fieldName: TFieldName) {
    return [`${fieldName}.current`, z.string()] as const;
  },
};

export const zodMethods = {
  ...zodPrimitives,
  ...zodExtras,
} as ZodMethods;
export type ZodMethods = typeof zodPrimitives & typeof zodExtras;
