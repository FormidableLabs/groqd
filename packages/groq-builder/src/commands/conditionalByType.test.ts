import { describe, it, expect } from "vitest";
import {
  createGroqBuilder,
  ExtractTypeNames,
  GroqBuilder,
  IGroqBuilder,
  InferResultItem,
  InferResultType,
} from "../index";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { ExtractConditionalProjectionTypes } from "./conditional-types";
import { expectType } from "../tests/expectType";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { Empty, Simplify, SimplifyDeep } from "../types/utils";

const q = createGroqBuilder<SchemaConfig>({ indent: "  " });
const data = mock.generateSeedData({
  products: mock.array(5, (i) =>
    mock.product({ slug: mock.slug({ current: `product-slug-${i}` }) })
  ),
});

describe("conditionalByType", () => {
  const conditionalByType = q.star.conditionalByType({
    variant: { _type: q.infer(), name: q.infer(), price: q.infer() },
    product: { _type: q.infer(), name: q.infer(), slug: "slug.current" },
    category: (qC) => ({
      _type: q.infer(),
      name: q.infer(),
      slug: qC.field("slug.current"),
    }),
  });

  type ExpectedConditionalUnion =
    | Empty
    | { _type: "variant"; name: string; price: number }
    | { _type: "product"; name: string; slug: string }
    | { _type: "category"; name: string; slug: string };

  it('should have a "spreadable" signature', () => {
    expectType<SimplifyDeep<typeof conditionalByType>>().toStrictEqual<
      SimplifyDeep<{
        "[Conditional] [ByType]": IGroqBuilder<ExpectedConditionalUnion>;
      }>
    >();

    expect(conditionalByType).toMatchObject({
      "[Conditional] [ByType]": expect.any(GroqBuilder),
    });
  });

  describe("multiple conditionals can be spread", () => {
    const qMultiple = q.star.project((q) => ({
      ...q.conditionalByType({
        variant: { price: q.infer() },
        product: { slug: "slug.current" },
      }),
      ...q.conditionalByType(
        {
          category: { description: q.infer() },
          style: { name: q.infer() },
        },
        { key: "unique-key" }
      ),
    }));

    it("should infer the correct type", () => {
      type ActualItem = Simplify<InferResultItem<typeof qMultiple>>;
      type ExpectedItem =
        | Empty
        | { price: number }
        | { slug: string }
        | { description: string | undefined }
        | { name: string | undefined }
        | { price: number; description: string | undefined }
        | { price: number; name: string | undefined }
        | { slug: string; description: string | undefined }
        | { slug: string; name: string | undefined };

      type Remainder = Exclude<ActualItem, ExpectedItem>;
      expectType<Remainder>().toStrictEqual<never>();
      expectType<ActualItem>().toStrictEqual<ExpectedItem>();
    });

    it("the query should be correct", () => {
      expect(qMultiple.query).toMatchInlineSnapshot(`
        "* {
            _type,
            _type == \\"variant\\" => {
                price
              },
            _type == \\"product\\" => {
                \\"slug\\": slug.current
              },
            _type == \\"category\\" => {
                description
              },
            _type == \\"style\\" => {
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
        product: { _type: q.infer(), name: q.infer() },
        variant: { _type: q.infer(), price: q.infer() },
      });

    type ActualItem = ExtractConditionalProjectionTypes<
      typeof conditionsExhaustive
    >;
    type ExpectedItem =
      | { _type: "product"; name: string }
      | { _type: "variant"; price: number };

    expectType<Simplify<ActualItem>>().toStrictEqual<ExpectedItem>();
  });

  it("should be able to extract the return types", () => {
    type ConditionalResults = ExtractConditionalProjectionTypes<
      typeof conditionalByType
    >;

    expectType<ConditionalResults>().toStrictEqual<
      | Empty
      | { _type: "variant"; name: string; price: number }
      | { _type: "product"; name: string; slug: string }
      | { _type: "category"; name: string; slug: string }
    >();
  });

  const qAll = q.star.project((qA) => ({
    _type: q.infer(),
    ...qA.conditionalByType({
      product: { _type: q.infer(), name: q.infer(), slug: "slug.current" },
      variant: { name: q.infer(), price: q.infer() },
    }),
  }));

  it("a projection should return the correct types", () => {
    type QueryResult = InferResultType<typeof qAll>;

    type DocTypes = ExtractTypeNames<SchemaConfig["documentTypes"]>;
    expectType<QueryResult>().toStrictEqual<
      Array<
        | {
            _type: DocTypes;
          }
        | {
            _type: "product";
            name: string;
            slug: string;
          }
        | {
            _type: DocTypes;
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
          _type == \\"product\\" => {
              _type,
              name,
              \\"slug\\": slug.current
            },
          _type == \\"variant\\" => {
              name,
              price
            }
        }"
    `);
  });

  it("should execute correctly", async () => {
    const res = await executeBuilder(qAll, data.datalake);

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
