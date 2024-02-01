import { expect, describe, it, expectTypeOf } from "vitest";
import { createGroqBuilderWithZod, InferResultType } from "../index";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { TypeMismatchError } from "../types/utils";

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
      expectTypeOf<InferResultType<typeof qWithZod>>().toEqualTypeOf<
        Array<{
          name: string;
          price: number;
          id: string | null;
        }>
      >();
    });
    it("should execute with valid data", async () => {
      const data = mock.generateSeedData({
        variants: [
          mock.variant({ name: "NAME", price: 999, id: "ID" }),
          mock.variant({ name: "NAME", price: 999, id: undefined }),
        ],
      });

      expect(qWithZod.query).toMatchInlineSnapshot(
        '"*[_type == \\"variant\\"] { name, price, id }"'
      );

      expect(await executeBuilder(qWithZod, data.datalake))
        .toMatchInlineSnapshot(`
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
        '"*[_type == \\"variant\\"] { name, price, id }"'
      );

      await expect(() => executeBuilder(qWithZod, data.datalake)).rejects
        .toThrowErrorMatchingInlineSnapshot(`
        "3 Parsing Errors:
        result[0].price: Expected number, received null
        result[1].name: Expected string, received null
        result[1].id: Expected string, received number"
      `);
    });
  });
  describe("q.default helper", () => {
    it('should have a type error if zod.string().default("") is used', () => {
      // @ts-expect-error --- Parser expects a different input type
      const qErr = qVariants.project({
        id: q.string().default("DEFAULT"),
      });
      expectTypeOf<InferResultType<typeof qErr>>().toEqualTypeOf<
        Array<{
          id:
            | string
            | TypeMismatchError<{
                error: "⛔️ Parser expects a different input type ⛔️";
                expected: string | undefined;
                actual: null;
              }>;
        }>
      >();

      // @ts-expect-error --- Parser expects a different input type
      const qRes = qVariants.project({
        id: q.string(),
      });
      expectTypeOf<InferResultType<typeof qRes>>().toEqualTypeOf<
        Array<{
          id:
            | string
            | TypeMismatchError<{
                error: "⛔️ Parser expects a different input type ⛔️";
                expected: string;
                actual: null;
              }>;
        }>
      >();
    });
    it("infers the correct type", () => {
      const qNormal = qVariants.project({ id: true });
      expectTypeOf<InferResultType<typeof qNormal>>().toEqualTypeOf<
        Array<{
          id: string | null;
        }>
      >();

      const query = qVariants.project({
        id: q.default(q.string(), "DEFAULT"),
      });
      expectTypeOf<InferResultType<typeof query>>().toEqualTypeOf<
        Array<{
          id: string;
        }>
      >();
    });
  });
  describe("q.nullToUndefined helper", () => {
    it("optional types shouldn't normally work", () => {
      // @ts-expect-error ---
      const qErr = qVariants.project({
        id: q.string().optional(),
      });
      expectTypeOf<InferResultType<typeof qErr>>().toEqualTypeOf<
        Array<{
          id:
            | string
            | undefined
            | TypeMismatchError<{
                error: "⛔️ Parser expects a different input type ⛔️";
                expected: string | undefined;
                actual: null;
              }>;
        }>
      >();
    });
    it("unless wrapped with nullToUndefined", () => {
      const qValid = qVariants.project({
        id: q.nullToUndefined(q.string().optional()),
      });
      expectTypeOf<InferResultType<typeof qValid>>().toEqualTypeOf<
        Array<{
          id: string | undefined;
        }>
      >();
    });
  });

  describe("zod input widening", () => {
    const qVariant = qVariants.slice(0);
    it("should complain if the parser's input is narrower than the input", () => {
      // First, show that `id` is optional/nullable
      const qResultNormal = qVariant.project({ id: true });
      expectTypeOf<InferResultType<typeof qResultNormal>>().toEqualTypeOf<{
        id: string | null;
      }>();

      // Now, let's pick `id` with a too-narrow parser:
      // @ts-expect-error ---
      const qResult = qVariant.project({ id: q.string() });
      // Ensure we return an error result:
      expectTypeOf<InferResultType<typeof qResult>>().toEqualTypeOf<{
        id:
          | string
          | TypeMismatchError<{
              error: "⛔️ Parser expects a different input type ⛔️";
              expected: string;
              actual: null;
            }>;
      }>();
    });
    it("shouldn't complain if the parser's input is wider than the input", () => {
      // First, show that `name` is a required string:
      const qName = qVariants.project({ name: true });
      expectTypeOf<InferResultType<typeof qName>>().toEqualTypeOf<
        Array<{
          name: string;
        }>
      >();

      // Now let's use a parser that allows for string | null:
      const qWideParser = qVariant.project({
        name: q.string().nullable(),
      });
      expectTypeOf<InferResultType<typeof qWideParser>>().toEqualTypeOf<{
        name: string | null;
      }>();
    });
  });
});
