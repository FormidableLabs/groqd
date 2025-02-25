import { describe, expect, expectTypeOf, it } from "vitest";
import { InferResultType, z } from "../../index";
import { q } from "../../tests/schemas/nextjs-sanity-fe";
import { mock } from "../../tests/mocks/nextjs-sanity-fe-mocks";
import { executeBuilder } from "../../tests/mocks/executeQuery";
import { getSubquery } from "../../tests/getSubquery";

describe("select", () => {
  const qBase = q.star.filterByType("variant", "product", "category");
  const sub = getSubquery(q);

  describe("without a default value", () => {
    describe("should infer the correct type", () => {
      it("with a single condition", () => {
        const qSel = sub.select({
          '_type == "variant"': q.value("VARIANT"),
        });
        expectTypeOf<InferResultType<typeof qSel>>().toEqualTypeOf<
          "VARIANT" | null
        >();
      });
      it("with multiple selections", () => {
        const qSelMultiple = sub.select({
          '_type == "variant"': q.value("VARIANT"),
          '_type == "product"': q.value("PRODUCT"),
          '_type == "category"': q.value("CATEGORY"),
        });
        expectTypeOf<InferResultType<typeof qSelMultiple>>().toEqualTypeOf<
          "VARIANT" | "PRODUCT" | "CATEGORY" | null
        >();
      });

      it("with complex mixed selections", () => {
        const qSelMultiple = sub.select({
          '_type == "variant"': q.value("VARIANT"),
          '_type == "nested"': q.project({ nested: q.value("NESTED") }),
          '_type == "deeper"': q.project({
            nested: q.project({ deep: q.value("DEEP") }),
          }),
        });

        expectTypeOf<InferResultType<typeof qSelMultiple>>().toEqualTypeOf<
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
    const qSelect = qBase.project((sub) => ({
      selected: sub.select(
        {
          '_type == "variant"': q.value("VARIANT"),
          '_type == "product"': q.value("PRODUCT"),
        },
        q.value("OTHER")
      ),
    }));

    const data = mock.generateSeedData({
      variants: mock.array(2, () => mock.variant({})),
      products: mock.array(3, () => mock.product({})),
      categories: mock.array(4, () => mock.category({})),
    });

    it("the result types should be correct", () => {
      expectTypeOf<InferResultType<typeof qSelect>>().toEqualTypeOf<
        Array<{
          selected: "VARIANT" | "PRODUCT" | "OTHER";
        }>
      >();
    });

    it("the query should be formed correctly", () => {
      expect(qSelect.query).toMatchInlineSnapshot(`
        "*[_type == "variant" || _type == "product" || _type == "category"] {
            "selected": select(
              _type == "variant" => "VARIANT",
              _type == "product" => "PRODUCT",
              "OTHER"
            )
          }"
      `);
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(qSelect, data);
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
    const qSelect = qBase.project((qB) => ({
      selected: qB.select({
        '_type == "product"': qB.asType<"product">().project({
          _type: z.literal("product"),
          name: z.string(),
        }),
        '_type == "variant"': qB.asType<"variant">().project({
          _type: z.literal("variant"),
          name: z.string(),
          price: z.number(),
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
        [ValidationErrors: 2 Parsing Errors:
        result[0].selected: Conditional parsing failed; all 2 conditions failed
        result[2].selected: Conditional parsing failed; all 2 conditions failed]
      `);
    });
  });
});
