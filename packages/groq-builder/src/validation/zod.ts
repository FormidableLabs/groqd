import { z } from "zod";
import { nullToUndefined } from "../commands/functions/nullToUndefined";
import { ParserFunction } from "../types/public-types";

export const zod = {
  string: z.string,
  number: z.number,
  boolean: z.boolean,
  literal: z.literal,
  union: z.union,
  date: z.date,
  null: z.null,
  undefined: z.undefined,
  array: z.array,
  object: z.object,
  nullToUndefined,
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
};
