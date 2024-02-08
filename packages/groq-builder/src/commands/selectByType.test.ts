import { describe, expect, expectTypeOf, it } from "vitest";
import { createGroqBuilder, InferResultType, zod } from "../index";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";

describe("selectByType", () => {
  const q = createGroqBuilder<SchemaConfig>({ indent: "  " });
  const qBase = q.star.filterByType("product", "variant", "category");

  const data = mock.generateSeedData({
    categories: mock.array(1, () => mock.category({})),
    products: mock.array(2, () => mock.product({})),
    variants: mock.array(3, () => mock.variant({})),
  });

  it("can be used with or without callback functions", () => {
    const qWithCb = qBase.project((qB) => ({
      selected: qB.selectByType({
        product: (qP) => qP.value("PRODUCT"), // <-- uses the callback API
      }),
    }));
    const qWithoutCb = qBase.project((qB) => ({
      selected: qB.selectByType({
        product: qB.value("PRODUCT"), // <-- no callback
      }),
    }));

    expectTypeOf<InferResultType<typeof qWithCb>>().toEqualTypeOf<
      Array<{ selected: "PRODUCT" | null }>
    >();
    expectTypeOf<InferResultType<typeof qWithoutCb>>().toEqualTypeOf<
      Array<{ selected: "PRODUCT" | null }>
    >();

    expect(qWithCb.query).toEqual(qWithoutCb.query);
    expect(qWithCb.query).toMatchInlineSnapshot(`
      "*[_type == \\"product\\" || _type == \\"variant\\" || _type == \\"category\\"] {
          \\"selected\\": select(
            _type == \\"product\\" => \\"PRODUCT\\"
          )
        }"
    `);
  });

  describe("without a default param", () => {
    const qSelect = qBase.project((qB) => ({
      selected: qB.selectByType({
        product: (qP) =>
          qP.project({
            _type: true,
            name: true,
          }),
        variant: (qP) =>
          qP.project({
            _type: true,
            name: true,
            price: true,
          }),
      }),
    }));

    it("should infer the correct types", () => {
      type TSelect = InferResultType<typeof qSelect>;
      expectTypeOf<TSelect>().toEqualTypeOf<
        Array<{
          selected:
            | { _type: "product"; name: string }
            | { _type: "variant"; name: string; price: number }
            | null;
        }>
      >();
    });

    it("no runtime validation is used", () => {
      // @ts-expect-error ---
      expect(qSelect.internal.parser).toBe(null);
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
      const results = await executeBuilder(qSelect, data);
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
    const qSelect = qBase.project((qB) => ({
      selected: qB.selectByType(
        {
          product: (qP) => qP.field("name"),
          variant: (qV) => qV.field("price"),
        },
        qB.value("UNKNOWN")
      ),
    }));

    it("should infer the correct type", () => {
      expectTypeOf<InferResultType<typeof qSelect>>().toEqualTypeOf<
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

    it("no runtime validation is used", () => {
      // @ts-expect-error ---
      expect(qSelect.internal.parser).toBe(null);
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qSelect, data);

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

  describe("with validation", () => {
    const qSelect = qBase.project((qB) => ({
      selected: qB.selectByType({
        product: (qP) =>
          qP.project({
            _type: zod.literal("product"),
            name: zod.string(),
          }),
        variant: (qV) =>
          qV.project({
            _type: zod.literal("variant"),
            name: zod.string(),
            price: zod.number(),
          }),
      }),
    }));

    const data = mock.generateSeedData({
      products: [mock.product({})],
      variants: [mock.variant({})],
      categories: [mock.category({})],
    });
    const invalidData = mock.generateSeedData({
      products: [
        mock.product({
          // @ts-expect-error ---
          name: 999,
        }),
      ],
      variants: [
        mock.variant({
          // @ts-expect-error ---
          price: "EXPENSIVE",
        }),
      ],
      categories: [mock.category({})],
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qSelect, data);
      expect(results).toMatchInlineSnapshot(`
        [
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
        ]
      `);
    });
    it("should fail with invalid data", async () => {
      await expect(() => executeBuilder(qSelect, invalidData)).rejects
        .toThrowErrorMatchingInlineSnapshot(`
        "2 Parsing Errors:
        result[0].selected: Conditional parsing failed; all 2 conditions failed
        result[2].selected: Conditional parsing failed; all 2 conditions failed"
      `);
    });
  });
});
