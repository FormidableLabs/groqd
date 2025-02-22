import { ContentBlock, SanitySchema } from "../schemas/nextjs-sanity-fe";

export class MockFactory {
  // Common helpers:
  randomNumber(max: number) {
    return Math.floor(Math.random() * max);
  }
  id(prefix: string) {
    return `${prefix}:${this.randomNumber(99999)}`;
  }
  date() {
    return new Date().toISOString();
  }
  common<TType extends string>(_type: TType) {
    return {
      _id: this.id(_type),
      _type,
      _createdAt: this.date(),
      _updatedAt: this.date(),
      _rev: "0",
    };
  }
  array<T>(
    length: number,
    factory: (index: number) => T
  ): Array<T & { _key: string }> {
    return new Array(length)
      .fill(null)
      .map((_, i) => ({ _key: `${i}`, ...factory(i) }));
  }
  withKeys<T>(items: Array<T>): Array<T & { _key: string }> {
    return items.map((item, index) => ({
      _key: `key-${index}`,
      ...item,
    }));
  }

  // Datalake helpers:
  slug(prefix: string | { current: string }) {
    const current =
      typeof prefix === "string" ? this.id(prefix) : prefix.current;
    return { _type: "slug" as const, current };
  }
  reference(data: { _id: string }) {
    return {
      _type: "reference" as const,
      _key: this.id("reference"),
      _ref: data._id,
      // This value is not actually needed, but it's required by TypeScript::
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [SanitySchema.internalGroqTypeReferenceTo]: null as any,
    };
  }

  // Document types:
  product(data: Partial<SanitySchema.Product>): SanitySchema.Product {
    return {
      ...this.common("product"),
      name: "Name",
      slug: this.slug("product"),
      variants: [],
      categories: [],
      images: [],
      description: [],
      ...data,
    } satisfies Required<SanitySchema.Product>;
  }
  category(data: Partial<SanitySchema.Category>): SanitySchema.Category {
    return {
      ...this.common("category"),
      slug: this.slug("category"),
      description: "",
      name: "Category Name",
      images: [],
      ...data,
    } satisfies Required<SanitySchema.Category>;
  }
  variant(data: Partial<SanitySchema.Variant>): SanitySchema.Variant {
    const common = this.common("variant");
    return {
      ...common,
      id: common._id,
      slug: this.slug("variant"),
      name: "Variant Name",
      description: [],
      flavour: [],
      images: [],
      price: 0,
      msrp: 0,
      style: [],
      ...data,
    } satisfies Required<SanitySchema.Variant>;
  }

  flavour(data: Partial<SanitySchema.Flavour>): SanitySchema.Flavour {
    const common = this.common("flavour");
    return {
      ...common,
      name: "Flavour Name",
      slug: this.slug("flavour"),
      ...data,
    } satisfies Required<SanitySchema.Flavour>;
  }

  image(data: Partial<SanitySchema.ProductImage>): SanitySchema.ProductImage {
    return {
      ...this.common("productImage"),
      name: "ProductImage",
      description: "Product Image",
      asset: this.reference({ _id: "mock-image-id" }),
      hotspot: {
        _type: "sanity.imageHotspot",
      },
      crop: {
        _type: "sanity.imageCrop",
      },
      ...data,
    } satisfies Required<SanitySchema.ProductImage>;
  }
  imageAsset(
    data: Partial<SanitySchema.SanityImageAsset>
  ): SanitySchema.SanityImageAsset {
    return {
      ...this.common("sanity.imageAsset"),
      originalFilename: "originalFilename",
      label: "label",
      title: "title",
      description: "description",
      altText: "altText",
      sha1hash: "sha1hash",
      extension: "extension",
      mimeType: "mimeType",
      size: 100,
      assetId: "assetId",
      uploadId: "uploadId",
      path: "path",
      url: "url",
      metadata: undefined as any,
      source: undefined as any,
      ...data,
    } satisfies Required<SanitySchema.SanityImageAsset>;
  }

  keyed<T>(data: T): T & { _key: string } {
    return {
      _key: "",
      ...data,
    };
  }

  contentBlock(data: Partial<ContentBlock>): ContentBlock {
    return {
      _type: "block",
      _key: "",
      children: [{ _type: "span", _key: "", text: "", marks: [] }],
      markDefs: [],
      style: undefined,
      ...data,
    };
  }

  // Entire datasets:
  generateSeedData({
    categories = this.array(10, (i) =>
      this.category({ name: `Category ${i}` })
    ),
    variants = this.array(10, (i) => this.variant({ name: `Variant ${i}` })),
    products = this.array(10, (i) =>
      this.product({
        name: `Product ${i}`,
        categories: categories.map((c) => this.reference(c)),
        variants: variants.map((c) => this.reference(c)),
      })
    ),
    extraData = [],
  }: {
    categories?: SanitySchema.Category[];
    variants?: SanitySchema.Variant[];
    products?: SanitySchema.Product[];
    extraData?: Array<object>;
  }) {
    const datalake = [...products, ...categories, ...variants, ...extraData];

    return { products, categories, variants, datalake };
  }
}

export const mock = new MockFactory();
