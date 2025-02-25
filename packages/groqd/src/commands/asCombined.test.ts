import { describe, expect, expectTypeOf, it } from "vitest";
import { InferResultItem } from "../groq-builder";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { q, SanitySchema, z } from "../tests/schemas/nextjs-sanity-fe";
import { Combine } from "../types/union-to-intersection";
import { UndefinedToNull } from "../types/utils";

const data = mock.generateSeedData({});
describe("asCombined", () => {
  const qCombined = q.star.filterByType("product", "variant").asCombined();

  const qCombinedProjection = qCombined.project({
    // Common:
    _type: true,
    _id: z.string(),
    name: true,
    slug: "slug.current",

    // Product only:
    categories: true,
    variants: true,

    // Variant only:
    price: z.number().nullable(),
    flavour: true,
    style: true,
  });

  it("just checking all the possible keys", () => {
    type CommonKeys = keyof (SanitySchema.Product | SanitySchema.Variant);
    type ProductOnly = Exclude<
      keyof SanitySchema.Product,
      keyof SanitySchema.Variant
    >;
    type VariantOnly = Exclude<
      keyof SanitySchema.Variant,
      keyof SanitySchema.Product
    >;

    expectTypeOf<CommonKeys>().toEqualTypeOf<
      | "_id"
      | "_type"
      | "_createdAt"
      | "_updatedAt"
      | "_rev"
      | "slug"
      | "name"
      | "description"
      | "images"
    >();
    expectTypeOf<ProductOnly>().toEqualTypeOf<"categories" | "variants">();
    expectTypeOf<VariantOnly>().toEqualTypeOf<
      "id" | "msrp" | "price" | "flavour" | "style"
    >();
  });

  it("should have the right type", () => {
    type CombinedResult = InferResultItem<typeof qCombined>;
    type ExpectedResult = Combine<SanitySchema.Product | SanitySchema.Variant>;
    expectTypeOf<CombinedResult>().toEqualTypeOf<ExpectedResult>();
  });

  it("should allow projections of all keys", () => {
    type ResultType = InferResultItem<typeof qCombinedProjection>;
    expectTypeOf<ResultType>().toEqualTypeOf<{
      // Common:
      _type: "product" | "variant";
      _id: string;
      name: string;
      slug: string;

      // Product only:
      categories: UndefinedToNull<SanitySchema.Product["categories"]>;
      variants: UndefinedToNull<SanitySchema.Product["variants"]>;

      // Variant only:
      price: number | null;
      flavour: UndefinedToNull<SanitySchema.Variant["flavour"]>;
      style: UndefinedToNull<SanitySchema.Variant["style"]>;
    }>();
  });

  it("should execute correctly", async () => {
    const results = await executeBuilder(qCombinedProjection, data);
    expect(results).toMatchInlineSnapshot(`
      [
        {
          "_id": "product:1",
          "_type": "product",
          "categories": [
            {
              "_key": "reference:key:1",
              "_ref": "category:1",
              "_type": "reference",
            },
            {
              "_key": "reference:key:2",
              "_ref": "category:2",
              "_type": "reference",
            },
          ],
          "flavour": null,
          "name": "Product 0",
          "price": null,
          "slug": "slug:product:1",
          "style": null,
          "variants": [
            {
              "_key": "reference:key:3",
              "_ref": "variant:1",
              "_type": "reference",
            },
            {
              "_key": "reference:key:4",
              "_ref": "variant:2",
              "_type": "reference",
            },
          ],
        },
        {
          "_id": "product:2",
          "_type": "product",
          "categories": [
            {
              "_key": "reference:key:5",
              "_ref": "category:1",
              "_type": "reference",
            },
            {
              "_key": "reference:key:6",
              "_ref": "category:2",
              "_type": "reference",
            },
          ],
          "flavour": null,
          "name": "Product 1",
          "price": null,
          "slug": "slug:product:2",
          "style": null,
          "variants": [
            {
              "_key": "reference:key:7",
              "_ref": "variant:1",
              "_type": "reference",
            },
            {
              "_key": "reference:key:8",
              "_ref": "variant:2",
              "_type": "reference",
            },
          ],
        },
        {
          "_id": "variant:1",
          "_type": "variant",
          "categories": null,
          "flavour": [],
          "name": "Variant 0",
          "price": 0,
          "slug": "slug:variant:1",
          "style": [],
          "variants": null,
        },
        {
          "_id": "variant:2",
          "_type": "variant",
          "categories": null,
          "flavour": [],
          "name": "Variant 1",
          "price": 0,
          "slug": "slug:variant:2",
          "style": [],
          "variants": null,
        },
      ]
    `);
  });
});
