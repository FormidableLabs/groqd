import { referenced, SanitySchema } from "../schemas/nextjs-sanity-fe";

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
  array<T>(length: number, factory: (index: number) => T): T[] {
    return new Array(length).fill(null).map((_, i) => factory(i));
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
      _key: this.id(`reference`),
      _ref: data._id,
      // This value is not actually needed, but it's required by TypeScript::
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [referenced]: null as any,
    };
  }

  // Document types:
  product(
    data: Partial<SanitySchema.Product>,
    references?: {
      categories?: SanitySchema.Category[];
      variants?: SanitySchema.Variant[];
    }
  ): SanitySchema.Product {
    return {
      ...this.common("product"),
      name: "Name",
      slug: this.slug("product"),
      variants: references?.variants?.map((v) => this.reference(v)) ?? [],
      categories: references?.categories?.map((c) => this.reference(c)) ?? [],
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
  variant(
    data: Partial<SanitySchema.Variant>,
    references?: {
      flavour: SanitySchema.Flavour[];
      style: SanitySchema.Style[];
    }
  ): SanitySchema.Variant {
    const common = this.common("variant");
    return {
      ...common,
      id: common._id,
      slug: this.slug("variant"),
      name: "Variant Name",
      description: [],
      flavour: references?.flavour.map((f) => this.reference(f)) ?? [],
      images: [],
      price: 0,
      msrp: 0,
      style: references?.style.map((s) => this.reference(s)) ?? [],
      ...data,
    } satisfies Required<SanitySchema.Variant>;
  }

  image(data: Partial<SanitySchema.ProductImage>): SanitySchema.ProductImage {
    return {
      ...this.common("productImage"),
      name: "ProductImage",
      description: "Product Image",
      asset: this.reference({ _id: "mock-image-id" }),
      ...data,
    } satisfies Required<SanitySchema.ProductImage>;
  }

  keyed<T>(data: T): T & { _key: string } {
    return {
      _key: "",
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
      this.product(
        { name: `Product ${i}` },
        { categories: categories, variants: variants }
      )
    ),
  }: {
    categories?: SanitySchema.Category[];
    variants?: SanitySchema.Variant[];
    products?: SanitySchema.Product[];
  }) {
    const datalake = [...products, ...categories, ...variants];

    return { products, categories, variants, datalake };
  }
}

export const mock = new MockFactory();
