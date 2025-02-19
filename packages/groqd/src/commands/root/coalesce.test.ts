import { describe, it, expect, expectTypeOf } from "vitest";
import { q, SanitySchema, zod } from "../../tests/schemas/nextjs-sanity-fe";
import { InferResultItem, InferResultType } from "../../types/public-types";
import { executeBuilder } from "../../tests/mocks/executeQuery";
import { mock } from "../../tests/mocks/nextjs-sanity-fe-mocks";

describe("coalesce", () => {
  describe("as a root-level query", () => {
    describe("should have the correct type", () => {
      it("with literal values", () => {
        const qAB = q.coalesce(q.value("A"), q.value("B"));
        expectTypeOf<InferResultType<typeof qAB>>().toEqualTypeOf<"A" | "B">();

        const qABC = q.coalesce(q.value("A"), q.value("B"), q.value("C"));
        expectTypeOf<InferResultType<typeof qABC>>().toEqualTypeOf<
          "A" | "B" | "C"
        >();

        const qA_B = q.coalesce(q.value("A").nullable(), q.value("B"));
        expectTypeOf<InferResultType<typeof qA_B>>().toEqualTypeOf<"A" | "B">();

        const qA_B_C = q.coalesce(
          q.value("A").nullable(),
          q.value("B").nullable(),
          q.value("C")
        );
        expectTypeOf<InferResultType<typeof qA_B_C>>().toEqualTypeOf<
          "A" | "B" | "C"
        >();

        const qA_B_C_ = q.coalesce(
          q.value("A").nullable(),
          q.value("B").nullable(),
          q.value("C").nullable()
        );
        expectTypeOf<InferResultType<typeof qA_B_C_>>().toEqualTypeOf<
          "A" | "B" | "C" | null
        >();

        const qAB_ = q.coalesce(q.value("A"), q.value("B").nullable());
        expectTypeOf<InferResultType<typeof qAB_>>().toEqualTypeOf<
          "A" | "B" | null
        >();
      });
    });
    it("should execute correctly", async () => {
      // const productCount = await executeBuilder(qProductCount, data);
      // expect(productCount).toEqual(data.products.length);
    });
  });

  describe("in a projection", () => {
    const qVariants = q.star.filterByType("variant");
    it("can use a projection string", () => {
      const qTests = qVariants.project((sub) => ({
        id_name: sub.coalesce("id", "name"),
        name_id: sub.coalesce("name", "id"),
        name_price: sub.coalesce("name", "price"),
        id_price: sub.coalesce("id", "price"),
        name_id_price: sub.coalesce("name", "id", "price"),
      }));
      expectTypeOf<InferResultItem<typeof qTests>>().toEqualTypeOf<{
        id_name: string;
        name_id: string | null;
        name_price: number | string;
        id_price: string | number;
        name_id_price: string | number;
      }>();
    });
    it("can use any nested groq expression", () => {
      const qTests = qVariants.project((sub) => ({
        flavour_style: sub.coalesce(
          sub.field("flavour[]").deref(),
          sub.field("style[]").deref()
        ),
      }));
      expectTypeOf<InferResultItem<typeof qTests>>().toEqualTypeOf<{
        flavour_style:
          | Array<SanitySchema.Flavour>
          | Array<SanitySchema.Style>
          | null;
      }>();
    });

    const data = mock.generateSeedData({
      variants: [
        mock.variant({ id: undefined, _id: "A" }),
        mock.variant({ id: undefined, _id: "B" }),
        mock.variant({ id: "C", _id: "FOO" }),
        mock.variant({ id: undefined, _id: undefined }),
      ],
    });
    it("executes correctly", async () => {
      const query = qVariants.project((v) => ({
        coalesceTest: v.coalesce("id", "_id"),
      }));
      const results = await executeBuilder(query, data);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "coalesceTest": "A",
          },
          {
            "coalesceTest": "B",
          },
          {
            "coalesceTest": "C",
          },
          {
            "coalesceTest": null,
          },
        ]
      `);
    });
    it("executes correctly with validation", async () => {
      const query = qVariants.project((v) => ({
        coalesceTest: v.coalesce(
          v.field("id", zod.string().nullable()),
          v.field("_id", zod.string().nullable()),
          q.value("DEFAULT", zod.literal("DEFAULT"))
        ),
      }));
      const results = await executeBuilder(query, data);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "coalesceTest": "A",
          },
          {
            "coalesceTest": "B",
          },
          {
            "coalesceTest": "C",
          },
          {
            "coalesceTest": "DEFAULT",
          },
        ]
      `);

      const invalidData = mock.generateSeedData({
        variants: [
          mock.variant({
            // @ts-expect-error ---
            id: 55,
          }),
          mock.variant({
            // @ts-expect-error ---
            _id: 66,
          }),
        ],
      });
      await expect(() => executeBuilder(query, invalidData)).rejects
        .toThrowErrorMatchingInlineSnapshot(`
        [ValidationErrors: 4 Parsing Errors:
        result[0].coalesceTest: Expected string, received number
        result[0].coalesceTest: Expected string, received number
        result[0].coalesceTest: Invalid literal value, expected "DEFAULT"
        result[0].coalesceTest: Expected the value to match one of the values above, but got: 55]
      `);
    });
  });

  describe("with validation", () => {
    const valueA = q.value("A", q.literal("A"));
    const valueB = q.value("B", q.literal("B"));
    const valueANull = q.value("A", q.literal("A").nullable());

    describe("when all expressions include validation", () => {
      const query = q.coalesce(valueANull, valueA, valueB);
      it("should allow all expressions to include validation", () => {
        expect(query.parser).toBeDefined();
      });
      it("should parse valid inputs without problem", () => {
        query.parse("A");
        query.parse("B");
        query.parse(null);
      });
      it("should throw errors when the input is invalid", () => {
        expect(() => {
          query.parse("INVALID");
        }).toThrowErrorMatchingInlineSnapshot(`
          [ValidationErrors: 4 Parsing Errors:
          result: Invalid literal value, expected "A"
          result: Invalid literal value, expected "A"
          result: Invalid literal value, expected "B"
          result: Expected the value to match one of the values above, but got: "INVALID"]
        `);
      });
    });
    describe("when only some expressions include validation", () => {
      it("should throw an InvalidQueryError", () => {
        expect(() => {
          q.coalesce(valueA, q.value("NOT VALIDATED"));
        }).toThrowErrorMatchingInlineSnapshot(
          `[Error: [COALESCE_MISSING_VALIDATION] With 'coalesce', you must supply validation for either all, or none, of the expressions. You did not supply validation for ""NOT VALIDATED""]`
        );
        expect(() => {
          q.coalesce(valueA, q.value("NOT VALIDATED"), valueB, q.value("SAME"));
        }).toThrowErrorMatchingInlineSnapshot(
          `[Error: [COALESCE_MISSING_VALIDATION] With 'coalesce', you must supply validation for either all, or none, of the expressions. You did not supply validation for ""NOT VALIDATED"" or ""SAME""]`
        );
      });
    });
  });
});
