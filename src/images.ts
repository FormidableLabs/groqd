import { z } from "zod";

const imageRefBase = z.object({
  _key: z.string(),
  _type: z.string(),
  asset: z.object({
    _ref: z.string(),
    _type: z.literal("reference"),
  }),
  crop: z
    .object({
      top: z.number(),
      bottom: z.number(),
      left: z.number(),
      right: z.number(),
    })
    .optional()
    .nullable(),
  hotspot: z
    .object({
      x: z.number(),
      y: z.number(),
      height: z.number(),
      width: z.number(),
    })
    .optional()
    .nullable(),
});
const imageRefBaseMerge = imageRefBase.merge;

/**
 * Overload the imageRef so user can optionally pass a selection that gets merged into the base selection.
 */
export function imageRef(): typeof imageRefBase;
export function imageRef<Incoming extends z.ZodRawShape>(
  additionalSchema: Incoming
): ReturnType<typeof imageRefBaseMerge<z.ZodObject<Incoming>>>;

export function imageRef(...args: any[]) {
  return args.length === 0
    ? imageRefBase
    : imageRefBaseMerge(z.object(args[0]));
}
