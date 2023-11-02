import { _referenced, SanitySchema } from "../schemas/nextjs-sanity-fe";

type Category = SanitySchema["category"];
type CategoryImage = SanitySchema["categoryImage"];
type Flavour = SanitySchema["flavour"];
type Product = SanitySchema["product"];
type ProductImage = SanitySchema["productImage"];
type SiteSettings = SanitySchema["siteSettings"];
type Style = SanitySchema["style"];
type Variant = SanitySchema["variant"];

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

  // Dataset helpers:
  slug(prefix: string) {
    return { _type: "slug" as const, current: this.id(prefix) };
  }
  reference(data: { _id: string }) {
    return {
      _type: "reference" as const,
      _key: this.id(`reference`),
      _ref: data._id,
      // This value is not actually needed, but it's required by TypeScript::
      [_referenced]: null as any,
    };
  }

  // Document types:
  product(
    data: Partial<Product>,
    references?: { categories?: Category[]; variants?: Variant[] }
  ): Product {
    return {
      ...this.common("product"),
      name: "Name",
      slug: this.slug("product"),
      variants: references?.variants?.map((v) => this.reference(v)) ?? [],
      categories: references?.categories?.map((c) => this.reference(c)) ?? [],
      images: [],
      description: [],
      ...data,
    } satisfies Required<Product>;
  }
  category(data: Partial<Category>): Category {
    return {
      ...this.common("category"),
      slug: this.slug("category"),
      description: "",
      name: "Category Name",
      images: [],
      ...data,
    } satisfies Required<Category>;
  }
  variant(
    data: Partial<Variant>,
    references?: { flavour: Flavour[]; style: Style[] }
  ): Variant {
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
    } satisfies Required<Variant>;
  }

  // Entire datasets:
  datalake() {
    const categories = this.array(10, (i) =>
      this.category({ name: `Category ${i}` })
    );
    const variants = this.array(10, (i) =>
      this.variant({ name: `Variant ${i}` })
    );
    const products = this.array(10, (i) =>
      this.product(
        { name: `Product ${i}` },
        { categories: categories, variants: variants }
      )
    );

    const datalake = [...products, ...categories, ...variants];
    return datalake;
  }
}

export const mock = new MockFactory();
