import { describe, expect, it } from "vitest";
import { expectType } from "../tests/expectType";
import { createGroqBuilder, InferResultType } from "../index";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";

describe("selectByType", () => {
  const q = createGroqBuilder<SchemaConfig>({ indent: "  " });

  const data = mock.generateSeedData({
    categories: mock.array(1, () => mock.category({})),
    products: mock.array(2, () => mock.product({})),
    variants: mock.array(3, () => mock.variant({})),
  });

  describe("without a default param", () => {
    const qSelect = q.star
      .filterByType("product", "variant", "category")
      .project((q) => ({
        selected: q.selectByType({
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

    it("should infer the correct types", () => {
      type TSelect = InferResultType<typeof qSelect>;
      expectType<TSelect>().toStrictEqual<
        Array<{
          selected:
            | { _type: "product"; name: string }
            | { _type: "variant"; name: string; price: number }
            | null;
        }>
      >();
    });

    it("the query should be correct", () => {
      expect(qSelect.query).toMatchInlineSnapshot(`
        "*[_type == \\"product\\" || _type == \\"variant\\" || _type == \\"category\\"] {
            \\"selected\\": select(
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
            "selected": null,
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

  describe("with default param", () => {
    const qSelect = q.star
      .filterByType("product", "variant", "category")
      .project((q) => ({
        selected: q.selectByType(
          {
            product: (q) => q.field("name"),
            variant: (q) => q.field("price"),
          },
          q.value("UNKNOWN")
        ),
      }));

    it("should infer the correct type", () => {
      expectType<InferResultType<typeof qSelect>>().toStrictEqual<
        Array<{
          selected: string | number | "UNKNOWN";
        }>
      >();
    });
    it("the query should be correct", () => {
      expect(qSelect.query).toMatchInlineSnapshot(`
        "*[_type == \\"product\\" || _type == \\"variant\\" || _type == \\"category\\"] {
            \\"selected\\": select(
              _type == \\"product\\" => name,
              _type == \\"variant\\" => price,
              \\"UNKNOWN\\"
            )
          }"
      `);
    });
    it("should execute correctly", async () => {
      const results = await executeBuilder(qSelect, data.datalake);

      expect(results).toMatchInlineSnapshot(`
        [
          {
            "selected": "Name",
          },
          {
            "selected": "Name",
          },
          {
            "selected": "UNKNOWN",
          },
          {
            "selected": 0,
          },
          {
            "selected": 0,
          },
          {
            "selected": 0,
          },
        ]
      `);
    });
  });
});
