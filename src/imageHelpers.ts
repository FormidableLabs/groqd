import { z } from "zod";
import { q } from "./index";
import { EntityQuery, UnknownQuery } from "./builder";
import type { FromSelection, Selection } from "./grab";
import { schemas } from "./schemas";

const assetFields = new UnknownQuery({ query: "asset" }).grab({
  _ref: z.string(),
  _type: z.literal("reference"),
});
const cropFields = {
  crop: new UnknownQuery({ query: "crop" })
    .grab({
      top: schemas.number(),
      bottom: schemas.number(),
      left: schemas.number(),
      right: schemas.number(),
    })
    .optional()
    .nullable(),
};

const hotspotFields = {
  hotspot: new UnknownQuery({ query: "hotspot" })
    .grab({
      x: z.number(),
      y: z.number(),
      height: z.number(),
      width: z.number(),
    })
    .optional()
    .nullable(),
};

const refBase = {
  _key: z.string(),
  _type: z.string(),
  asset: assetFields,
} as const;

/**
 * Overload the imageRef so user can optionally pass a selection that gets merged into the base selection.
 */
export function imageRef(
  fieldName: string
): EntityQuery<FromSelection<typeof refBase>>;
export function imageRef<
  WithCrop extends boolean | undefined = undefined,
  WithHotspot extends true | undefined = undefined
>(
  fieldName: string,
  options: {
    withCrop?: WithCrop;
    withHotspot?: WithHotspot;
  }
): EntityQuery<
  FromSelection<
    typeof refBase &
      (WithCrop extends true ? typeof cropFields : Empty) &
      (WithHotspot extends true ? typeof hotspotFields : Empty)
  >
>;
export function imageRef(fieldName: string, options?: any) {
  const toGrab = Object.assign(
    {},
    refBase,
    options?.withCrop === true ? cropFields : {},
    options?.withHotspot === true ? hotspotFields : {}
  );

  return new UnknownQuery({ query: fieldName }).grab(toGrab);
}

type Empty = Record<never, never>;

// export function imageRef<Incoming extends z.ZodRawShape>(
//   additionalSchema: Incoming
// ): ReturnType<typeof imageRefBaseMerge<z.ZodObject<Incoming>>>;
// export function imageRef(...args: any[]) {
//   return args.length === 0
//     ? imageRefBase
//     : imageRefBaseMerge(z.object(args[0]));
// }
