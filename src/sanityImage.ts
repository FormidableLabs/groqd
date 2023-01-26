import { ArrayQuery, EntityQuery, UnknownQuery } from "./builder";
import type { FromSelection, Selection } from "./grab";
import { schemas } from "./schemas";
import { ListIncludes } from "./types";

const reffedAssetFields = {
  _ref: schemas.string(),
  _type: schemas.literal("reference"),
};
const cropFields = {
  crop: schemas
    .object({
      top: schemas.number(),
      bottom: schemas.number(),
      left: schemas.number(),
      right: schemas.number(),
    })
    .nullable(),
};

const hotspotFields = {
  hotspot: schemas
    .object({
      x: schemas.number(),
      y: schemas.number(),
      height: schemas.number(),
      width: schemas.number(),
    })
    .nullable(),
};

const refBase = {
  _key: schemas.string().nullable(),
  _type: schemas.string(),
} as const;

const dereffedAssetBaseFields = {
  _id: schemas.string(),
  _type: schemas.literal("sanity.imageAsset"),
  _rev: schemas.string(),
  extension: schemas.string(),
  mimeType: schemas.string(),
  originalFilename: schemas.string(),
  path: schemas.string(),
  sha1hash: schemas.string(),
  size: schemas.number(),
  url: schemas.string(),
  _updatedAt: schemas.string().nullable(),
};

const paletteFieldSchema = {
  _type: schemas.literal("sanity.imagePaletteSwatch"),
  background: schemas.string().optional().nullable(),
  foreground: schemas.string().optional().nullable(),
  population: schemas.number().optional().nullable(),
  title: schemas.string().optional().nullable(),
};

const dimensionFields = {
  dimensions: schemas
    .object({
      _type: schemas.literal("sanity.imageDimensions"),
      aspectRatio: schemas.number(),
      height: schemas.number(),
      width: schemas.number(),
    })
    .nullable(),
};
const locationFields = {
  location: schemas
    .object({
      _type: schemas.literal("geopoint"),
      lat: schemas.number(),
      lng: schemas.number(),
    })
    .nullable(),
};
const lqipFields = {
  lqip: schemas.string(),
};
const getPaletteField = () => schemas.object(paletteFieldSchema).nullable();
const paletteFields = {
  palette: schemas.object({
    darkMuted: getPaletteField(),
    darkVibrant: getPaletteField(),
    dominant: getPaletteField(),
    lightMuted: getPaletteField(),
    lightVibrant: getPaletteField(),
    muted: getPaletteField(),
    vibrant: getPaletteField(),
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
  const { withCrop, withHotspot, additionalFields, isList, withAsset } =
    options || {};

  let asset = new UnknownQuery({ query: "asset" });
  if (withAsset) {
    asset = asset.deref();
  }
  const assetIncludes = (field: WithAssetOption) =>
    typeof withAsset?.includes === "function"
      ? withAsset.includes(field)
      : false;
  const metadataFields = Object.assign(
    {},
    assetIncludes("dimensions") && dimensionFields,
    assetIncludes("location") && locationFields,
    assetIncludes("lqip") && lqipFields,
    assetIncludes("palette") && paletteFields
  );
  const assetFields = Object.assign(
    {},
    !withAsset && reffedAssetFields,
    assetIncludes("base") && dereffedAssetBaseFields,
    Object.keys(metadataFields).length > 0 && {
      metadata: new UnknownQuery({ query: "metadata" }).grab(metadataFields),
    }
  );

  const toGrab = Object.assign(
    {},
    refBase,
    { asset: asset.grab(assetFields) },
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
      asset: Asset<WithAsset>;
    }
>;

type WithAssetOption = "base" | "dimensions" | "location" | "lqip" | "palette";

type Asset<
  WithAsset extends readonly WithAssetOption[] | undefined = undefined
> = EntityQuery<
  FromSelection<
    (undefined extends WithAsset ? typeof reffedAssetFields : Empty) &
      // Conditionally add in the base fields
      (ListIncludes<WithAsset, "base"> extends true
        ? typeof dereffedAssetBaseFields
        : Empty) &
      // We'll add in metadata only if non-base is included
      (ListIncludes<WithAsset, Exclude<WithAssetOption, "base">> extends true
        ? { metadata: AssetMetadata<WithAsset> }
        : Empty)
  >
>;

type AssetMetadata<
  WithAsset extends readonly WithAssetOption[] | undefined = undefined
> = EntityQuery<
  FromSelection<
    (ListIncludes<WithAsset, "dimensions"> extends true
      ? typeof dimensionFields
      : Empty) &
      (ListIncludes<WithAsset, "location"> extends true
        ? typeof locationFields
        : Empty) &
      (ListIncludes<WithAsset, "lqip"> extends true
        ? typeof lqipFields
        : Empty) &
      (ListIncludes<WithAsset, "palette"> extends true
        ? typeof paletteFields
        : Empty)
  >
>;
