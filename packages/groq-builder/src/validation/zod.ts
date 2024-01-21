import { z } from "zod";

export const zodValidations = {
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
};
