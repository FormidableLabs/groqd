import { describe, it, expect } from "vitest";
import {
  createGroqBuilder,
  ExtractTypeNames,
  GroqBuilder,
  IGroqBuilder,
  InferResultType,
} from "../index";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { ExtractConditionalProjectionTypes } from "./conditional-types";
import { expectType } from "../tests/expectType";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { Empty, SimplifyDeep } from "../types/utils";

const q = createGroqBuilder<SchemaConfig>({ indent: "  " });
const data = mock.generateSeedData({
  products: mock.array(5, (i) =>
    mock.product({ slug: mock.slug({ current: `product-slug-${i}` }) })
  ),
});

describe("conditionalByType", () => {
  const conditionalByType = q.star.conditionalByType({
    variant: { _type: true, name: true, price: true },
    product: { _type: true, name: true, slug: "slug.current" },
    category: (qC) => ({
      _type: true,
      name: true,
      slug: qC.field("slug.current"),
    }),
  });

  type ExpectedConditionalUnion =
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
    _type: true,
    ...qA.conditionalByType({
      product: { _type: true, name: true, slug: "slug.current" },
      variant: { name: true, price: true },
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
