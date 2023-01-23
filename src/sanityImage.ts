import { z } from "zod";
import { ArrayQuery, EntityQuery, UnknownQuery } from "./builder";
import type { FromSelection, Selection } from "./grab";
import { schemas } from "./schemas";
import { List } from "ts-toolbelt";

const reffedAssetFields = {
  _ref: z.string(),
  _type: z.literal("reference"),
};
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
} as const;

const dereffedAssetBaseFields = {
  _rev: schemas.string(),
  extension: schemas.string(),
  mimeType: schemas.string(),
  originalFilename: schemas.string(),
  path: schemas.string(),
  sha1hash: schemas.string(),
  size: schemas.number(),
  url: schemas.string(),
  _updatedAt: schemas.string(), // TODO: make a date?
};

const paletteFieldSchema = {
  // TODO: Should these be optional? I imagine palette extraction can fail (e.g. all-black image might not have a foreground color)
  background: schemas.string(),
  foreground: schemas.string(),
  population: schemas.number(),
  title: schemas.string(),
};

const dimensionFields = {
  dimensions: schemas.number(),
};
const locationFields = {
  location: schemas.string(),
};
const lqipFields = {
  lqip: schemas.string(),
};
const getPaletteField = (query: string) =>
  new UnknownQuery({ query }).grab(paletteFieldSchema);
const paletteFields = {
  palette: new UnknownQuery({ query: "palette" }).grab({
    darkMuted: getPaletteField("darkMuted"),
    darkVibrant: getPaletteField("darkVibrant"),
    dominant: getPaletteField("dominant"),
    lightMuted: getPaletteField("lightMuted"),
    lightVibrant: getPaletteField("lightVibrant"),
    muted: getPaletteField("muted"),
    vibrant: getPaletteField("vibrant"),
  }),
};

/**
 * Overload the imageRef so user can optionally pass a selection that gets merged into the base selection.
 */
export function sanityImage(fieldName: string): EntityQuery<
  FromSelection<
    typeof refBase & {
      asset: EntityQuery<FromSelection<typeof reffedAssetFields>>;
    }
  >
>;
export function sanityImage<
  WithCrop extends boolean | undefined = undefined,
  WithHotspot extends boolean | undefined = undefined,
  AdditionalSelection extends Selection | undefined = undefined,
  Multiple extends boolean | undefined = undefined,
  WithAsset extends readonly WithAssetOption[] | undefined = undefined
>(
  fieldName: string,
  options: {
    withCrop?: WithCrop;
    withHotspot?: WithHotspot;
    isList?: Multiple;
    additionalFields?: AdditionalSelection;
    withAsset?: WithAsset;
  }
): Multiple extends true
  ? ArrayQuery<
      ImageRefSchemaType<WithCrop, WithHotspot, AdditionalSelection, WithAsset>
    >
  : EntityQuery<
      ImageRefSchemaType<WithCrop, WithHotspot, AdditionalSelection, WithAsset>
    >;
export function sanityImage(fieldName: string, options?: any) {
  const { withCrop, withHotspot, additionalFields, isList } = options || {};

  // Implementation of our grab
  const toGrab = Object.assign(
    {},
    refBase,
    { asset: new UnknownQuery({ query: "asset" }).grab(reffedAssetFields) }, // TODO: fork here?
    withCrop === true ? cropFields : {},
    withHotspot === true ? hotspotFields : {},
    additionalFields || {}
  );

  return isList === true
    ? new UnknownQuery({ query: fieldName }).filter().grab(toGrab)
    : new UnknownQuery({ query: fieldName }).grab(toGrab);
}

type Empty = Record<never, never>;

type ImageRefSchemaType<
  WithCrop extends boolean | undefined = undefined,
  WithHotspot extends boolean | undefined = undefined,
  AdditionalSelection extends Selection | undefined = undefined,
  WithAsset extends readonly WithAssetOption[] | undefined = undefined
> = FromSelection<
  typeof refBase &
    (WithCrop extends true ? typeof cropFields : Empty) &
    (WithHotspot extends true ? typeof hotspotFields : Empty) &
    (undefined extends AdditionalSelection ? Empty : AdditionalSelection) & {
      asset: EntityQuery<
        FromSelection<
          typeof reffedAssetFields &
            // Conditionally add in the base fields
            (List.Includes<WithAsset & WithAssetOption[], "base"> extends 1
              ? typeof dereffedAssetBaseFields
              : Empty) &
            // We'll add in metadata only if non-base is included
            (List.Includes<
              WithAsset & WithAssetOption[],
              Exclude<WithAssetOption, "base">
            > extends 1
              ? {
                  metadata: EntityQuery<
                    FromSelection<
                      (List.Includes<
                        WithAsset & WithAssetOption[],
                        "dimensions"
                      > extends 1
                        ? typeof dimensionFields
                        : Empty) &
                        (List.Includes<
                          WithAsset & WithAssetOption[],
                          "location"
                        > extends 1
                          ? typeof locationFields
                          : Empty) &
                        (List.Includes<
                          WithAsset & WithAssetOption[],
                          "lqip"
                        > extends 1
                          ? typeof lqipFields
                          : Empty) &
                        (List.Includes<
                          WithAsset & WithAssetOption[],
                          "palette"
                        > extends 1
                          ? typeof paletteFields
                          : Empty)
                    >
                  >;
                }
              : Empty)
        >
      >;
    }
>;

type WithAssetOption = "base" | "dimensions" | "location" | "lqip" | "palette";
