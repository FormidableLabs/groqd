// Types generated from "./sanity-studio/sanity.config.ts"
export type SchemaConfig = {
  TSchema: SanitySchema;
  referenceSymbol: typeof _referenced;
};

export declare const _referenced: unique symbol;
export type SanitySchema = {
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
          [_referenced]: "categoryImage";
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
          [_referenced]: "category";
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
          [_referenced]: "variant";
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
          [_referenced]: "style";
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
          [_referenced]: "flavour";
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
