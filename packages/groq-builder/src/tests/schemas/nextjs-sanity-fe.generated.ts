/* Types generated from './sanity-studio/sanity.config.ts' */

export declare const decorator: unique symbol;
export declare const referenced: unique symbol;
export type SchemaValues = {
  "sanity.fileAsset": {
    _type: "sanity.fileAsset";
    metadata: { [x: string]: unknown };
    url: string;
    path: string;
    assetId: string;
    extension: string;
    mimeType: string;
    sha1hash: string;
    size: number;
    originalFilename?: string | undefined;
    label?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    creditLine?: string | undefined;
    source?: { id: string; name: string; url?: string | undefined } | undefined;
    _id: string;
    _createdAt: string;
    _updatedAt: string;
    _rev: string;
  };
  "sanity.imageAsset": {
    _type: "sanity.imageAsset";
    url: string;
    path: string;
    assetId: string;
    extension: string;
    mimeType: string;
    sha1hash: string;
    size: number;
    originalFilename?: string | undefined;
    label?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    creditLine?: string | undefined;
    source?: { id: string; name: string; url?: string | undefined } | undefined;
    _id: string;
    _createdAt: string;
    _updatedAt: string;
    _rev: string;
    metadata: {
      [x: string]: unknown;
      _type: "sanity.imageMetadata";
      dimensions: {
        _type: "sanity.imageDimensions";
        height: number;
        width: number;
        aspectRatio: number;
      };
      palette?:
        | {
            _type: "sanity.imagePalette";
            darkMuted?:
              | {
                  _type: "sanity.imagePaletteSwatch";
                  background: string;
                  foreground: string;
                  population: number;
                  title?: string | undefined;
                }
              | undefined;
            darkVibrant?:
              | {
                  _type: "sanity.imagePaletteSwatch";
                  background: string;
                  foreground: string;
                  population: number;
                  title?: string | undefined;
                }
              | undefined;
            dominant?:
              | {
                  _type: "sanity.imagePaletteSwatch";
                  background: string;
                  foreground: string;
                  population: number;
                  title?: string | undefined;
                }
              | undefined;
            lightMuted?:
              | {
                  _type: "sanity.imagePaletteSwatch";
                  background: string;
                  foreground: string;
                  population: number;
                  title?: string | undefined;
                }
              | undefined;
            lightVibrant?:
              | {
                  _type: "sanity.imagePaletteSwatch";
                  background: string;
                  foreground: string;
                  population: number;
                  title?: string | undefined;
                }
              | undefined;
            muted?:
              | {
                  _type: "sanity.imagePaletteSwatch";
                  background: string;
                  foreground: string;
                  population: number;
                  title?: string | undefined;
                }
              | undefined;
            vibrant?:
              | {
                  _type: "sanity.imagePaletteSwatch";
                  background: string;
                  foreground: string;
                  population: number;
                  title?: string | undefined;
                }
              | undefined;
          }
        | undefined;
      lqip?: string | undefined;
      blurHash?: string | undefined;
      hasAlpha: boolean;
      isOpaque: boolean;
      exif?:
        | { [x: string]: unknown; _type: "sanity.imageExifMetadata" }
        | undefined;
      location?:
        | {
            _type: "geopoint";
            lat: number;
            lng: number;
            alt?: number | undefined;
          }
        | undefined;
    };
  };
  description: {
    _type: "block";
    children: {
      text: string;
      _type: "span";
      [decorator]: any;
      marks: string[];
      _key: string;
    }[];
    level?: number | undefined;
    listItem?: any;
    markDefs: never[];
    style: any;
    _key: string;
  }[];
  style: {
    name?: string | undefined;
    slug: { _type: "slug"; current: string };
    _createdAt: string;
    _id: string;
    _rev: string;
    _updatedAt: string;
    _type: "style";
  };
  category: {
    name: string;
    slug: { _type: "slug"; current: string };
    description?: string | undefined;
    _createdAt: string;
    _id: string;
    _rev: string;
    _updatedAt: string;
    images?:
      | {
          _ref: string;
          _type: "reference";
          [referenced]?: "categoryImage";
          _key: string;
        }[]
      | undefined;
    _type: "category";
  };
  categoryImage: {
    name: string;
    description?: string | undefined;
    _createdAt: string;
    _id: string;
    _rev: string;
    _updatedAt: string;
    images: {
      _type: "image";
      asset: {
        _ref: string;
        _type: "reference";
        [referenced]?: "sanity.imageAsset";
      };
    };
    _type: "categoryImage";
  };
  flavour: {
    name?: string | undefined;
    slug: { _type: "slug"; current: string };
    _createdAt: string;
    _id: string;
    _rev: string;
    _updatedAt: string;
    _type: "flavour";
  };
  product: {
    name: string;
    slug: { _type: "slug"; current: string };
    description?:
      | {
          _type: "block";
          children: {
            text: string;
            _type: "span";
            [decorator]: any;
            marks: string[];
            _key: string;
          }[];
          level?: number | undefined;
          listItem?: any;
          markDefs: never[];
          style: any;
          _key: string;
        }[]
      | undefined;
    _createdAt: string;
    _id: string;
    _rev: string;
    _updatedAt: string;
    images?:
      | {
          name: string;
          description?: string | undefined;
          asset: {
            _ref: string;
            _type: "reference";
            [referenced]?: "sanity.imageAsset";
          };
          _type: "productImage";
          _key: string;
        }[]
      | undefined;
    categories?:
      | {
          _ref: string;
          _type: "reference";
          [referenced]?: "category";
          _key: string;
        }[]
      | undefined;
    variants?:
      | {
          _ref: string;
          _type: "reference";
          [referenced]?: "variant";
          _key: string;
        }[]
      | undefined;
    _type: "product";
  };
  productImage: {
    name: string;
    description?: string | undefined;
    asset: {
      _ref: string;
      _type: "reference";
      [referenced]?: "sanity.imageAsset";
    };
    _type: "productImage";
  };
  variant: {
    name: string;
    slug: { _type: "slug"; current: string };
    description?:
      | {
          _type: "block";
          children: {
            text: string;
            _type: "span";
            [decorator]: any;
            marks: string[];
            _key: string;
          }[];
          level?: number | undefined;
          listItem?: any;
          markDefs: never[];
          style: any;
          _key: string;
        }[]
      | undefined;
    style?:
      | {
          _ref: string;
          _type: "reference";
          [referenced]?: "style";
          _key: string;
        }[]
      | undefined;
    id?: string | undefined;
    _createdAt: string;
    _id: string;
    _rev: string;
    _updatedAt: string;
    images?:
      | {
          name: string;
          description?: string | undefined;
          asset: {
            _ref: string;
            _type: "reference";
            [referenced]?: "sanity.imageAsset";
          };
          _type: "productImage";
          _key: string;
        }[]
      | undefined;
    flavour?:
      | {
          _ref: string;
          _type: "reference";
          [referenced]?: "flavour";
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
    _createdAt: string;
    _id: string;
    _rev: string;
    _updatedAt: string;
    _type: "siteSettings";
  };
};
