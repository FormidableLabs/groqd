import { describe, expect, it } from "vitest";
import { expectType } from "../tests/expectType";
import { createGroqBuilder, InferResultType } from "../index";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";

describe("selectByType", () => {
  const q = createGroqBuilder<SchemaConfig>({ indent: "  " });

  const qSelect = q.star
    .filterByType("category", "product", "variant")
    .project((q) => ({
      selected: q.selectByType({
        category: (q) =>
          q.project({
            _type: true,
            name: true,
            description: true,
          }),
        product: (q) =>
          q.project({
            _type: true,
            name: true,
          }),
        variant: (q) =>
          q.project({
            _type: true,
            name: true,
            price: true,
          }),
      }),
    }));

  const data = mock.generateSeedData({
    categories: mock.array(1, () => mock.category({})),
    products: mock.array(2, () => mock.product({})),
    variants: mock.array(3, () => mock.variant({})),
  });

  it("should infer the correct types", () => {
    type TSelect = InferResultType<typeof qSelect>;
    expectType<TSelect>().toStrictEqual<
      Array<{
        selected:
          | { _type: "category"; name: string; description: string | undefined }
          | { _type: "product"; name: string }
          | { _type: "variant"; name: string; price: number };
      }>
    >();
  });

  it("the query should be correct", () => {
    expect(qSelect.query).toMatchInlineSnapshot(`
      "*[_type == \\"category\\" || _type == \\"product\\" || _type == \\"variant\\"] {
          \\"selected\\": select(
            _type == \\"category\\" =>  {
              _type,
              name,
              description
            },
            _type == \\"product\\" =>  {
              _type,
              name
            },
            _type == \\"variant\\" =>  {
              _type,
              name,
              price
            }
          )
        }"
    `);
  });

  it("should execute correctly", async () => {
    const results = await executeBuilder(qSelect, data.datalake);
    expect(results).toMatchInlineSnapshot(`
      [
        {
          "selected": {
            "_type": "product",
            "name": "Name",
          },
        },
        {
          "selected": {
            "_type": "product",
            "name": "Name",
          },
        },
        {
          "selected": {
            "_type": "category",
            "description": "",
            "name": "Category Name",
          },
        },
        {
          "selected": {
            "_type": "variant",
            "name": "Variant Name",
            "price": 0,
          },
        },
        {
          "selected": {
            "_type": "variant",
            "name": "Variant Name",
            "price": 0,
          },
        },
        {
          "selected": {
            "_type": "variant",
            "name": "Variant Name",
            "price": 0,
          },
        },
      ]
    `);
  });
});
