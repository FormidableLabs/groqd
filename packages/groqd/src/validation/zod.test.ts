import { expect, describe, it, expectTypeOf } from "vitest";
import { createGroqBuilderWithZod, InferResultItem } from "../index";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { TypeMismatchError } from "../types/type-mismatch-error";

const q = createGroqBuilderWithZod<SchemaConfig>();

const qVariants = q.star.filterByType("variant");

describe("with zod", () => {
  describe("simple projections", () => {
    const qWithZod = qVariants.project({
      name: q.string(),
      price: q.number(),
      id: q.string().nullable(),
    });

    it("should infer the right type", () => {
      expectTypeOf<InferResultItem<typeof qWithZod>>().toEqualTypeOf<{
        name: string;
        price: number;
        id: string | null;
      }>();
    });
    it("should execute with valid data", async () => {
      const data = mock.generateSeedData({
        variants: [
          mock.variant({ name: "NAME", price: 999, id: "ID" }),
          mock.variant({ name: "NAME", price: 999, id: undefined }),
        ],
      });

      expect(qWithZod.query).toMatchInlineSnapshot(
        `"*[_type == "variant"] { name, price, id }"`
      );

      expect(await executeBuilder(qWithZod, data)).toMatchInlineSnapshot(`
          [
            {
              "id": "ID",
              "name": "NAME",
              "price": 999,
            },
            {
              "id": null,
              "name": "NAME",
              "price": 999,
            },
          ]
        `);
    });
    it("should throw with invalid data", async () => {
      const data = mock.generateSeedData({
        variants: [
          mock.variant({ name: "NAME", price: undefined, id: "ID" }),
          // @ts-expect-error ---
          mock.variant({ name: undefined, price: 999, id: 999 }),
        ],
      });

      expect(qWithZod.query).toMatchInlineSnapshot(
        `"*[_type == "variant"] { name, price, id }"`
      );

      await expect(() => executeBuilder(qWithZod, data)).rejects
        .toThrowErrorMatchingInlineSnapshot(`
        [ValidationErrors: 3 Parsing Errors:
        result[0].price: Expected number, received null
        result[1].name: Expected string, received null
        result[1].id: Expected string, received number]
      `);
    });
  });
  describe("q.default helper", () => {
    it('should have a type error if zod.string().default("") is used', () => {
      // @ts-expect-error --- The parser for the 'id' field expects the wrong input type
      const qErr = qVariants.project({
        id: q.string().default("DEFAULT"),
      });
      expectTypeOf<InferResultItem<typeof qErr>>().toEqualTypeOf<{
        id:
          | string
          | TypeMismatchError<{
              error: `⛔️ The 'id' field has a data type that is not fully compatible with the specified parser ⛔️`;
              expected: string | undefined;
              actual: null;
            }>;
      }>();

      // @ts-expect-error --- The parser for the 'id' field expects the wrong input type
      const qRes = qVariants.project({
        id: q.string(),
      });
      expectTypeOf<InferResultItem<typeof qRes>>().toEqualTypeOf<{
        id:
          | string
          | TypeMismatchError<{
              error: `⛔️ The 'id' field has a data type that is not fully compatible with the specified parser ⛔️`;
              expected: string;
              actual: null;
            }>;
      }>();
    });
    it("infers the correct type", () => {
      const qNormal = qVariants.project({ id: true });
      expectTypeOf<InferResultItem<typeof qNormal>>().toEqualTypeOf<{
        id: string | null;
      }>();

      const query = qVariants.project({
        id: q.default(q.string(), "DEFAULT"),
      });
      expectTypeOf<InferResultItem<typeof query>>().toEqualTypeOf<{
        id: string;
      }>();
    });
  });
  describe("q.slug helper", () => {
    const qVariantSlugs = qVariants.project({
      SLUG: q.slug("slug"),
    });

    it("should have the correct type", () => {
      expectTypeOf<InferResultItem<typeof qVariantSlugs>>().toEqualTypeOf<{
        SLUG: string;
      }>();
    });

    it("should not allow invalid fields to be slugged", () => {
      qVariants.project({
        // @ts-expect-error ---
        name: q.slug("name"),
        // @ts-expect-error ---
        INVALID: q.slug("INVALID"),
      });
    });

    describe("execution", () => {
      const data = mock.generateSeedData({
        variants: [
          mock.variant({ slug: mock.slug({ current: "SLUG_1" }) }),
          mock.variant({ slug: mock.slug({ current: "SLUG_2" }) }),
          mock.variant({ slug: mock.slug({ current: "SLUG_3" }) }),
        ],
      });
      it("should retrieve all slugs", async () => {
        const result = await executeBuilder(qVariantSlugs, data);

        expect(result).toEqual([
          { SLUG: "SLUG_1" },
          { SLUG: "SLUG_2" },
          { SLUG: "SLUG_3" },
        ]);
      });
      it("should have errors for missing / invalid slugs", async () => {
        const data = mock.generateSeedData({
          variants: [
            // @ts-expect-error ---
            mock.variant({ slug: mock.slug({ current: 123 }) }),
            // @ts-expect-error ---
            mock.variant({ slug: mock.slug({ current: undefined }) }),
            mock.variant({ slug: undefined }),
            mock.variant({}),
          ],
        });

        await expect(() => executeBuilder(qVariantSlugs, data)).rejects
          .toThrowErrorMatchingInlineSnapshot(`
          [ValidationErrors: 3 Parsing Errors:
          result[0].SLUG: Expected string, received number
          result[1].SLUG: Expected string, received null
          result[2].SLUG: Expected string, received null]
        `);
      });
    });
  });

  describe("zod input widening", () => {
    it("should complain if the parser's input is narrower than the input", () => {
      // First, show that `id` is optional/nullable
      const qResultNormal = qVariants.project({ id: true });
      expectTypeOf<InferResultItem<typeof qResultNormal>>().toEqualTypeOf<{
        id: string | null;
      }>();

      // Now, let's pick `id` with a too-narrow parser:
      // @ts-expect-error ---
      const qResult = qVariants.project({ id: q.string() });
      // Ensure we return an error result:
      expectTypeOf<InferResultItem<typeof qResult>>().toEqualTypeOf<{
        id:
          | string
          | TypeMismatchError<{
              error: `⛔️ The 'id' field has a data type that is not fully compatible with the specified parser ⛔️`;
              expected: string;
              actual: null;
            }>;
      }>();
    });
    it("shouldn't complain if the parser's input is wider than the input", () => {
      // First, show that `name` is a required string:
      const qName = qVariants.project({ name: true });
      expectTypeOf<InferResultItem<typeof qName>>().toEqualTypeOf<{
        name: string;
      }>();

      // Now let's use a parser that allows for string | null:
      const qWideParser = qVariants.project({
        name: q.string().nullable(),
      });
      expectTypeOf<InferResultItem<typeof qWideParser>>().toEqualTypeOf<{
        name: string | null;
      }>();
    });
  });
});
