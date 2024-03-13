// Types generated from "./sanity-studio/sanity.config.ts"
import { ExtractDocumentTypes } from "../../types/schema-types";
import { Simplify } from "../../types/utils";
import { referenced, SchemaValues } from "./nextjs-sanity-fe.generated";

export type SchemaConfig = {
  documentTypes: ExtractDocumentTypes<SanitySchema.Reconstructed>;
  referenceSymbol: typeof referenced;
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SanitySchema {
  // We're going to "reconstruct" our types here,
  // so that we get better type aliases when debugging:

  type PromoteType<T extends { _type: string }> = {
    _type: T["_type"];
  } & Simplify<Omit<T, "_type">>;

  export type Description = SchemaValues["description"];
  export type Style = PromoteType<SchemaValues["style"]>;
  export type Category = PromoteType<SchemaValues["category"]>;
  export type CategoryImage = PromoteType<SchemaValues["categoryImage"]>;
  export type Flavour = PromoteType<SchemaValues["flavour"]>;
  export type Product = PromoteType<SchemaValues["product"]>;
  export type ProductImage = PromoteType<SchemaValues["productImage"]>;
  export type Variant = PromoteType<SchemaValues["variant"]>;
  export type SiteSettings = PromoteType<SchemaValues["siteSettings"]>;
  export type SanityImageAsset = PromoteType<SchemaValues["sanity.imageAsset"]>;
  export type SanityFileAsset = PromoteType<SchemaValues["sanity.fileAsset"]>;

  export type Reconstructed = {
    description: Description;
    style: Style;
    category: Category;
    categoryImage: CategoryImage;
    flavour: Flavour;
    product: Product;
    productImage: ProductImage;
    variant: Variant;
    siteSettings: SiteSettings;
    "sanity.imageAsset": SanityImageAsset;
    "sanity.fileAsset": SanityFileAsset;
  };

  export type ContentBlock = NonNullable<Variant["description"]>[0];
}
