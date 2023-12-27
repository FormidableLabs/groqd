import { describe, expect, it } from "vitest";
import { createGroqBuilder, InferResultType, validation } from "../index";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { executeBuilder } from "../tests/mocks/executeQuery";

const q = createGroqBuilder<SchemaConfig>({ indent: "  " });

describe("select$", () => {
  const qBase = q.star.filterByType("variant", "product", "category");

  describe("without a default value", () => {
    describe("should infer the correct type", () => {
      it("with a single condition", () => {
        const qSel = q.select$({
          '_type == "variant"': q.value("VARIANT"),
        });
        expectType<InferResultType<typeof qSel>>().toStrictEqual<
          "VARIANT" | null
        >();
      });
      it("with multiple selections", () => {
        const qSelMultiple = q.select$({
          '_type == "variant"': q.value("VARIANT"),
          '_type == "product"': q.value("PRODUCT"),
          '_type == "category"': q.value("CATEGORY"),
        });
        expectType<InferResultType<typeof qSelMultiple>>().toStrictEqual<
          "VARIANT" | "PRODUCT" | "CATEGORY" | null
        >();
      });

      it("with complex mixed selections", () => {
        const qSelMultiple = q.select$({
          '_type == "variant"': q.value("VARIANT"),
          '_type == "nested"': q.project({ nested: q.value("NESTED") }),
          '_type == "deeper"': q.project({
            nested: q.project({ deep: q.value("DEEP") }),
          }),
        });

        expectType<InferResultType<typeof qSelMultiple>>().toStrictEqual<
          | "VARIANT"
          | { nested: "NESTED" }
          | {
              nested: { deep: "DEEP" };
            }
          | null
        >();
      });
    });
  });

  describe("with a default value", () => {
    const qSelect = qBase.project({
      selected: q.select$(
        {
          '_type == "variant"': q.value("VARIANT"),
          '_type == "product"': q.value("PRODUCT"),
        },
        q.value("OTHER")
      ),
    });

    const data = mock.generateSeedData({
      variants: mock.array(2, () => mock.variant({})),
      products: mock.array(3, () => mock.product({})),
      categories: mock.array(4, () => mock.category({})),
    });

    it("the result types should be correct", () => {
      expectType<InferResultType<typeof qSelect>>().toStrictEqual<
        Array<{
          selected: "VARIANT" | "PRODUCT" | "OTHER";
        }>
      >();
    });

    it("the query should be formed correctly", () => {
      expect(qSelect.query).toMatchInlineSnapshot(`
        "*[_type == \\"variant\\" || _type == \\"product\\" || _type == \\"category\\"] {
            \\"selected\\": select(
            _type == \\"variant\\" => \\"VARIANT\\",
            _type == \\"product\\" => \\"PRODUCT\\",
            \\"OTHER\\"
          )
          }"
      `);
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qSelect, data.datalake);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "selected": "PRODUCT",
          },
          {
            "selected": "PRODUCT",
          },
          {
            "selected": "PRODUCT",
          },
          {
            "selected": "OTHER",
          },
          {
            "selected": "OTHER",
          },
          {
            "selected": "OTHER",
          },
          {
            "selected": "OTHER",
          },
          {
            "selected": "VARIANT",
          },
          {
            "selected": "VARIANT",
          },
        ]
      `);
    });
  });

  describe("with validation", () => {
    const qSelect = qBase.project((q) => ({
      selected: q.select$({
        '_type == "product"': q.project({
          _type: validation.literal("product"),
          name: validation.string(),
        }),
        '_type == "variant"': q.project({
          _type: validation.literal("variant"),
          name: validation.string(),
          price: validation.number(),
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
      await expect(() => executeBuilder(qSelect, invalidData.datalake)).rejects
        .toThrowErrorMatchingInlineSnapshot(`
        "2 Parsing Errors:
        result[0].selected: Conditional parsing failed; all 2 conditions failed
        result[2].selected: Conditional parsing failed; all 2 conditions failed"
      `);
    });
  });
});
