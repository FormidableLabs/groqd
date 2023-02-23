import { z } from "zod";

/**
 * Custom date schema that will parse date strings to Date objects
 */
const dateSchema = () =>
  z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date());

/**
 * Content block schema for standard content blocks.
 */
const contentBlock = () =>
  z.object({
    _type: z.literal("block"),
    _key: z.string().optional(),
    children: z.array(
      z.object({
        _key: z.string(),
        _type: z.string(),
        text: z.string(),
        marks: z.array(z.string()),
      })
    ),
    markDefs: z
      .array(
        z
          .object({
            _type: z.string(),
            _key: z.string(),
          })
          .catchall(z.unknown())
      )
      .optional(),
    style: z.string().optional(),
    listItem: z.string().optional(),
    level: z.number().optional(),
  });

const contentBlocks = () => z.array(contentBlock());

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
