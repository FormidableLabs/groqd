import { z } from "zod";
import { contentBlock, contentBlocks } from "./contentBlock";

/**
 * Custom date schema that will parse date strings to Date objects
 */
const dateSchema = () =>
  z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date());

const slug = (fieldName: string) =>
  [`${fieldName}.current`, z.string()] as [string, z.ZodString];

export const schemas = {
  string: z.string,
  number: z.number,
  boolean: z.boolean,
  unknown: z.unknown,
  null: z.null,
  undefined: z.undefined,
  date: dateSchema,
  literal: z.literal,
  union: z.union,
  array: z.array,
  object: z.object,
  slug,
  contentBlock,
  contentBlocks,
};
