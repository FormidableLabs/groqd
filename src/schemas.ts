import { z } from "zod";

const dateSchema = () =>
  z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date());

export const schemas = {
  string: z.string,
  number: z.number,
  boolean: z.number,
  unknown: z.unknown,
  null: z.null,
  undefined: z.undefined,
  date: dateSchema,
  literal: z.literal,
  union: z.union,
  array: z.array,
};
