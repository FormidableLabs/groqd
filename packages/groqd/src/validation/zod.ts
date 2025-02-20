import { z } from "zod";
import { ParserFunction } from "../types/public-types";
import { pick } from "../types/utils";

const zodPrimitives = pick(z, [
  "string",
  "number",
  "boolean",
  "null",
  "date",
  "literal",
  "union",
  "array",
  "object",
]);

const zodExtras = {
  /**
   * Zod's `.default()` method doesn't work well with GROQ,
   * since GROQ only returns `null` and never `undefined`.
   *
   * So instead of chaining Zod's `default` method,
   * use this `default` method instead.
   *
   * @example
   * // Before:
   * zod.number().default(0)
   * // After:
   * zod.default(zod.number(), 0)
   */
  default<TZodSchema extends z.ZodType<any, any, any>>(
    schema: TZodSchema,
    defaultValue: z.output<TZodSchema>
  ): ParserFunction<z.input<TZodSchema> | null, z.output<TZodSchema>> {
    return (input) => {
      if (input === null) return defaultValue;
      return schema.parse(input);
    };
  },

  /**
   * Shorthand for accessing the current value for a slug.
   *
   * @example
   * // Before:
   * q.star.filterByType("product").project({
   *   slug: ["slug.current", z.string()],
   * })
   * // After:
   * q.star.filterByType("product").project({
   *   slug: zod.slug("slug"),
   * })
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
