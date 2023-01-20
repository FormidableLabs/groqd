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

/**
 * TypeScript voodoo to be able to use ReturnType on a generic function so that we
 *   don't have to shadow Zod's z.ZodObject.merge return type.
 */
class MergeWrapper<Incoming extends z.ZodRawShape> {
  merge = (incoming: z.ZodObject<Incoming>) =>
    imageRefBase.merge<z.ZodObject<Incoming>>(incoming);
}

/**
 * Overload the imageRef so user can optionally pass a selection that gets merged into the base selection.
 */
export function imageRef(): typeof imageRefBase;
export function imageRef<Incoming extends z.ZodRawShape>(
  additionalSchema: Incoming
): ReturnType<MergeWrapper<Incoming>["merge"]>;

export function imageRef(...args: any[]) {
  return args.length === 0
    ? imageRefBase
    : imageRefBase.merge(z.object(args[0]));
}
