import { z } from "zod";

/**
 * Represents an array of blocks of Sanity's portable text.
 */
export type SanityContentBlocks<TMarkDefs extends MarkDefsBase = MarkDefsBase> =
  Array<SanityContentBlock<TMarkDefs>>;

/**
 * Represents a block of Sanity's portable text, for fields defined as `type: "block"`.
 * This rich text type can be expanded via custom `markDefs`.
 */
export type SanityContentBlock<TMarkDefs extends MarkDefsBase = MarkDefsBase> =
  {
    _type: "block";
    _key: string;
    level?: number;
    style?: string; // eg. "normal" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "blockquote";
    listItem?: string; // eg. "bullet" | "number";
    markDefs?: Array<TMarkDefs>;
    children?: Array<{
      _type: string; // eg. "span";
      _key: string;
      text?: string;
      marks?: Array<string>;
    }>;
  };

export type MarkDefsBase = {
  _type: string; // eg. "link";
  _key: string;
};

const markDefBase = z
  .object({
    _type: z.string(),
    _key: z.string(),
  })
  .catchall(z.unknown()) satisfies z.ZodType<MarkDefsBase>;

export type ContentBlockOverrides<TMarkDefs extends MarkDefsBase> = {
  /**
   * Supply your own custom markDef definitions.
   *
   * @example
   * markDefs: z.object({
   *   _type: z.literal("link"),
   *   _key: z.string(),
   *   href: z.string().optional(),
   * })
   */
  markDefs?: z.ZodType<TMarkDefs>;
};
export function contentBlocks<TMarkDefs extends MarkDefsBase = MarkDefsBase>(
  overrides?: ContentBlockOverrides<TMarkDefs>
) {
  return z.array(contentBlock(overrides));
}
export function contentBlock<TMarkDefs extends MarkDefsBase = MarkDefsBase>({
  markDefs = markDefBase as z.ZodType<TMarkDefs>,
}: ContentBlockOverrides<TMarkDefs> = {}): z.ZodType<
  SanityContentBlock<TMarkDefs>
> {
  return z.object({
    _type: z.literal("block"),
    _key: z.string(),
    level: z.number().optional(),
    style: z.string().optional(),
    listItem: z.string().optional(),
    markDefs: z.array(markDefs).optional(),
    children: z
      .array(
        z.object({
          _type: z.string(),
          _key: z.string(),
          text: z.string().optional(),
          marks: z.array(z.string()),
        })
      )
      .optional(),
  });
}
