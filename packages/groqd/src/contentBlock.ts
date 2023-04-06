import { z } from "zod";

/**
 * Content block schema for standard content blocks.
 */
export function contentBlock(): z.ZodObject<
  ReturnType<typeof makeContentBlockQuery<typeof baseMarkdefsType>>
>;
export function contentBlock<T extends z.ZodType>(args: {
  markDefs: T;
}): z.ZodObject<ReturnType<typeof makeContentBlockQuery<T>>>;
export function contentBlock({ markDefs }: { markDefs?: z.ZodType } = {}) {
  return z.object(makeContentBlockQuery(markDefs || baseMarkdefsType));
}

export function contentBlocks(): z.ZodArray<
  z.ZodObject<ReturnType<typeof makeContentBlockQuery<typeof baseMarkdefsType>>>
>;
export function contentBlocks<T extends z.ZodType>(args: {
  markDefs: T;
}): z.ZodArray<z.ZodObject<ReturnType<typeof makeContentBlockQuery<T>>>>;
export function contentBlocks({ markDefs }: { markDefs?: z.ZodType } = {}) {
  return z.array(z.object(makeContentBlockQuery(markDefs || baseMarkdefsType)));
}

export function makeContentBlockQuery(): typeof baseContentFields & {
  markDefs: z.ZodOptional<z.ZodArray<typeof baseMarkdefsType>>;
};
export function makeContentBlockQuery<T extends z.ZodType>(
  markDefs: T
): typeof baseContentFields & { markDefs: z.ZodOptional<z.ZodArray<T>> };
export function makeContentBlockQuery(markDefs?: z.ZodType) {
  return {
    ...baseContentFields,
    markDefs: z.array(markDefs || baseMarkdefsType).optional(),
  };
}

const baseContentFields = {
  _type: z.string(),
  _key: z.string().optional(),
  children: z.array(
    z.object({
      _key: z.string(),
      _type: z.string(),
      text: z.string(),
      marks: z.array(z.string()),
    })
  ),
  style: z.string().optional(),
  listItem: z.string().optional(),
  level: z.number().optional(),
} as const;

const baseMarkdefsType = z
  .object({
    _type: z.string(),
    _key: z.string(),
  })
  .catchall(z.unknown());
