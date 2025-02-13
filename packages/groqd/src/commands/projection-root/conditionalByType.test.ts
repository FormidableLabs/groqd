import { describe, expect, expectTypeOf, it } from "vitest";
import {
  ExtractDocumentTypes,
  GroqBuilder,
  IGroqBuilder,
  InferResultItem,
  InferResultType,
} from "../../index";
import { q, SchemaConfig } from "../../tests/schemas/nextjs-sanity-fe";
import { ExtractConditionalProjectionTypes } from "./conditional-types";
import { executeBuilder } from "../../tests/mocks/executeQuery";
import { mock } from "../../tests/mocks/nextjs-sanity-fe-mocks";
import { Simplify, SimplifyDeep } from "../../types/utils";

const data = mock.generateSeedData({
  products: mock.array(5, (i) =>
    mock.product({ slug: mock.slug({ current: `product-slug-${i}` }) })
  ),
});

type AllDocTypes = ExtractDocumentTypes<SchemaConfig["schemaTypes"]>;

describe("conditionalByType", () => {
  const conditionalByType = q.star.conditionalByType({
    variant: { name: true, price: true },
    product: { name: true, slug: "slug.current" },
    category: (qC) => ({
      name: true,
      slug: qC.field("slug.current"),
    }),
  });

  type ExpectedConditionalUnion =
    | { _type: Exclude<AllDocTypes, "variant" | "product" | "category"> }
    | { _type: "variant"; name: string; price: number }
    | { _type: "product"; name: string; slug: string }
    | { _type: "category"; name: string; slug: string };

  it('should have a "spreadable" signature', () => {
    expectTypeOf<SimplifyDeep<typeof conditionalByType>>().toEqualTypeOf<
      SimplifyDeep<{
        "[CONDITIONAL] [BY_TYPE]": IGroqBuilder<ExpectedConditionalUnion>;
      }>
    >();

    expect(conditionalByType).toMatchObject({
      "[CONDITIONAL] [BY_TYPE]": expect.any(GroqBuilder),
    });
  });

  describe("multiple conditionals can be spread", () => {
    const qMultiple = q.star.project((q) => ({
      ...q.conditionalByType({
        variant: { price: true },
        product: { slug: "slug.current" },
      }),
      ...q.conditionalByType(
        {
          category: { description: true },
          style: { name: true },
          // Overlapping conditional for "product":
          product: { name: true },
        },
        { key: "unique-key" }
      ),
    }));

    it("should infer the correct type", () => {
      type ActualItem = Simplify<InferResultItem<typeof qMultiple>>;

      type ExpectedItem =
        | {
            _type: Exclude<
              AllDocTypes,
              "variant" | "product" | "category" | "style"
            >;
          }
        | { _type: "variant"; price: number }
        | { _type: "product"; slug: string; name: string }
        | { _type: "category"; description: string | null }
        | { _type: "style"; name: string | null };

      type Remainder = Exclude<ActualItem, ExpectedItem>;
      expectTypeOf<Remainder>().toEqualTypeOf<never>();
      expectTypeOf<ActualItem>().toEqualTypeOf<ExpectedItem>();
    });

    it("the query should be correct", () => {
      expect(qMultiple.query).toMatchInlineSnapshot(`
        "* {
            _type,
            _type == "variant" => {
                price
              },
            _type == "product" => {
                "slug": slug.current
              },
            _type == "category" => {
                description
              },
            _type == "style" => {
                name
              },
            _type == "product" => {
                name
              }
          }"
      `);
    });
  });

  it("types are correct when the conditions are exhaustive", () => {
    const conditionsExhaustive = q.star
      .filterByType("product", "variant")
      .conditionalByType({
        product: { _type: true, name: true },
        variant: { _type: true, price: true },
      });

    type ActualItem = ExtractConditionalProjectionTypes<
      typeof conditionsExhaustive
    >;
    type ExpectedItem =
      | { _type: "product"; name: string }
      | { _type: "variant"; price: number };

    expectTypeOf<Simplify<ActualItem>>().toEqualTypeOf<ExpectedItem>();
  });

  it("should be able to extract the return types", () => {
    type ConditionalResults = ExtractConditionalProjectionTypes<
      typeof conditionalByType
    >;

    expectTypeOf<ConditionalResults>().toEqualTypeOf<
      | { _type: Exclude<AllDocTypes, "variant" | "product" | "category"> }
      | { _type: "variant"; name: string; price: number }
      | { _type: "product"; name: string; slug: string }
      | { _type: "category"; name: string; slug: string }
    >();
  });

  const qAll = q.star.project((qA) => ({
    ...qA.conditionalByType({
      product: { name: true, slug: "slug.current" },
      variant: { name: true, price: true },
    }),
  }));

  it("a projection should return the correct types", () => {
    type QueryResult = InferResultType<typeof qAll>;

    expectTypeOf<QueryResult>().toEqualTypeOf<
      Array<
        | {
            _type: Exclude<AllDocTypes, "product" | "variant">;
          }
        | {
            _type: "product";
            name: string;
            slug: string;
          }
        | {
            _type: "variant";
            name: string;
            price: number;
          }
      >
    >();
  });

  it("a projection should return the correct query", () => {
    expect(qAll.query).toMatchInlineSnapshot(`
      "* {
          _type,
          _type == "product" => {
              name,
              "slug": slug.current
            },
          _type == "variant" => {
              name,
              price
            }
        }"
    `);
  });

  it("should execute correctly", async () => {
    const res = await executeBuilder(qAll, data);

    expect(res.find((item) => item._type === "category"))
      .toMatchInlineSnapshot(`
      {
        "_type": "category",
      }
    `);
    expect(res.find((item) => item._type === "variant")).toMatchInlineSnapshot(`
      {
        "_type": "variant",
        "name": "Variant 0",
        "price": 0,
      }
    `);
    expect(res.find((item) => item._type === "product")).toMatchInlineSnapshot(
      `
      {
        "_type": "product",
        "name": "Name",
        "slug": "product-slug-0",
      }
    `
    );
  });
});
