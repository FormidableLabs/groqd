// Types generated from "./sanity-studio/sanity.config.ts"
import { ExtractDocumentTypes } from "../../utils/schema-types";
import { Simplify } from "../../utils/type-utils";

export type SchemaConfig = {
  documentTypes: ExtractDocumentTypes<SanitySchema.Reconstructed>;
  referenceSymbol: typeof referenced;
};

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace SanitySchema {
  // We're going to "reconstruct" our types here,
  // so that we get better type aliases when debugging:
  export type Description = SanitySchemaGenerated["description"];
  export type Style = PromoteType<SanitySchemaGenerated["style"]>;
  export type Category = PromoteType<SanitySchemaGenerated["category"]>;
  export type CategoryImage = PromoteType<
    SanitySchemaGenerated["categoryImage"]
  >;
  export type Flavour = PromoteType<SanitySchemaGenerated["flavour"]>;
  export type Product = PromoteType<SanitySchemaGenerated["product"]>;
  export type ProductImage = PromoteType<SanitySchemaGenerated["productImage"]>;
  export type Variant = PromoteType<SanitySchemaGenerated["variant"]>;
  export type SiteSettings = PromoteType<SanitySchemaGenerated["siteSettings"]>;

  type PromoteType<T extends { _type: string }> = {
    _type: T["_type"];
  } & Simplify<Omit<T, "_type">>;

  export type Reconstructed = {
    style: Style;
    category: Category;
    categoryImage: CategoryImage;
    flavour: Flavour;
    product: Product;
    productImage: ProductImage;
    variant: Variant;
    siteSettings: SiteSettings;
  };
}

export declare const referenced: unique symbol;
type SanitySchemaGenerated = {
  description: {
    _type: "block";
    children: {
      _type: "span";
      text: string;
      marks?: string[] | undefined;
      _key: string;
    }[];
    markDefs?: { _type: string; _key: string }[] | undefined;
    style?: string | undefined;
    listItem?: string | undefined;
    level?: number | undefined;
    _key: string;
  }[];
  style: {
    slug: { _type: "slug"; current: string };
    name?: string | undefined;
    _id: string;
    _createdAt: string;
    _updatedAt: string;
    _rev: string;
    _type: "style";
  };
  category: {
    slug: { _type: "slug"; current: string };
    name: string;
    description?: string | undefined;
    _id: string;
    _createdAt: string;
    _updatedAt: string;
    _rev: string;
    images?:
      | {
          _ref: string;
          _weak?: boolean | undefined;
          _strengthenOnPublish?:
            | {
                type: string;
                weak?: boolean | undefined;
                template?:
                  | {
                      id: string;
                      params: { [x: string]: string | number | boolean };
                    }
                  | undefined;
              }
            | undefined;
          _type: "reference";
          [referenced]: "categoryImage";
          _key: string;
        }[]
      | undefined;
    _type: "category";
  };
  categoryImage: {
    name: string;
    description?: string | undefined;
    _id: string;
    _createdAt: string;
    _updatedAt: string;
    _rev: string;
    images: {
      _type: "image";
      asset: {
        _type: string;
        _ref: string;
        _key?: string | undefined;
        _weak?: boolean | undefined;
        _strengthenOnPublish?:
          | {
              type: string;
              weak?: boolean | undefined;
              template?:
                | {
                    id: string;
                    params: { [x: string]: string | number | boolean };
                  }
                | undefined;
            }
          | undefined;
      };
    };
    _type: "categoryImage";
  };
  flavour: {
    slug: { _type: "slug"; current: string };
    name?: string | undefined;
    _id: string;
    _createdAt: string;
    _updatedAt: string;
    _rev: string;
    _type: "flavour";
  };
  product: {
    slug: { _type: "slug"; current: string };
    name: string;
    description?:
      | {
          _type: "block";
          children: {
            _type: "span";
            text: string;
            marks?: string[] | undefined;
            _key: string;
          }[];
          markDefs?: { _type: string; _key: string }[] | undefined;
          style?: string | undefined;
          listItem?: string | undefined;
          level?: number | undefined;
          _key: string;
        }[]
      | undefined;
    _id: string;
    _createdAt: string;
    _updatedAt: string;
    _rev: string;
    images?:
      | {
          name: string;
          description?: string | undefined;
          asset: {
            _type: string;
            _ref: string;
            _key?: string | undefined;
            _weak?: boolean | undefined;
            _strengthenOnPublish?:
              | {
                  type: string;
                  weak?: boolean | undefined;
                  template?:
                    | {
                        id: string;
                        params: { [x: string]: string | number | boolean };
                      }
                    | undefined;
                }
              | undefined;
          };
          _type: "productImage";
          _key: string;
        }[]
      | undefined;
    categories?:
      | {
          _ref: string;
          _weak?: boolean | undefined;
          _strengthenOnPublish?:
            | {
                type: string;
                weak?: boolean | undefined;
                template?:
                  | {
                      id: string;
                      params: { [x: string]: string | number | boolean };
                    }
                  | undefined;
              }
            | undefined;
          _type: "reference";
          [referenced]: "category";
          _key: string;
        }[]
      | undefined;
    variants?:
      | {
          _ref: string;
          _weak?: boolean | undefined;
          _strengthenOnPublish?:
            | {
                type: string;
                weak?: boolean | undefined;
                template?:
                  | {
                      id: string;
                      params: { [x: string]: string | number | boolean };
                    }
                  | undefined;
              }
            | undefined;
          _type: "reference";
          [referenced]: "variant";
          _key: string;
        }[]
      | undefined;
    _type: "product";
  };
  productImage: {
    name: string;
    description?: string | undefined;
    asset: {
      _type: string;
      _ref: string;
      _key?: string | undefined;
      _weak?: boolean | undefined;
      _strengthenOnPublish?:
        | {
            type: string;
            weak?: boolean | undefined;
            template?:
              | {
                  id: string;
                  params: { [x: string]: string | number | boolean };
                }
              | undefined;
          }
        | undefined;
    };
    _type: "productImage";
  };
  variant: {
    slug: { _type: "slug"; current: string };
    name: string;
    description?:
      | {
          _type: "block";
          children: {
            _type: "span";
            text: string;
            marks?: string[] | undefined;
            _key: string;
          }[];
          markDefs?: { _type: string; _key: string }[] | undefined;
          style?: string | undefined;
          listItem?: string | undefined;
          level?: number | undefined;
          _key: string;
        }[]
      | undefined;
    style?:
      | {
          _ref: string;
          _weak?: boolean | undefined;
          _strengthenOnPublish?:
            | {
                type: string;
                weak?: boolean | undefined;
                template?:
                  | {
                      id: string;
                      params: { [x: string]: string | number | boolean };
                    }
                  | undefined;
              }
            | undefined;
          _type: "reference";
          [referenced]: "style";
          _key: string;
        }[]
      | undefined;
    _id: string;
    _createdAt: string;
    _updatedAt: string;
    _rev: string;
    id?: string | undefined;
    images?:
      | {
          name: string;
          description?: string | undefined;
          asset: {
            _type: string;
            _ref: string;
            _key?: string | undefined;
            _weak?: boolean | undefined;
            _strengthenOnPublish?:
              | {
                  type: string;
                  weak?: boolean | undefined;
                  template?:
                    | {
                        id: string;
                        params: { [x: string]: string | number | boolean };
                      }
                    | undefined;
                }
              | undefined;
          };
          _type: "productImage";
          _key: string;
        }[]
      | undefined;
    flavour?:
      | {
          _ref: string;
          _weak?: boolean | undefined;
          _strengthenOnPublish?:
            | {
                type: string;
                weak?: boolean | undefined;
                template?:
                  | {
                      id: string;
                      params: { [x: string]: string | number | boolean };
                    }
                  | undefined;
              }
            | undefined;
          _type: "reference";
          [referenced]: "flavour";
          _key: string;
        }[]
      | undefined;
    msrp: number;
    price: number;
    _type: "variant";
  };
  siteSettings: {
    title?: string | undefined;
    description?: string | undefined;
    _id: string;
    _createdAt: string;
    _updatedAt: string;
    _rev: string;
    _type: "siteSettings";
  };
};
