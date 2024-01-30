import { expect, describe, it } from "vitest";
import { createGroqBuilder, InferResultType, zod } from "../index";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { TypeMismatchError } from "../types/utils";

const q = createGroqBuilder<SchemaConfig>().include(zod);
const qVariants = q.star.filterByType("variant");

describe("with zod", () => {
  describe("simple projections", () => {
    const qWithZod = qVariants.project({
      name: q.string(),
      price: q.number(),
      id: q.string().nullable(),
    });

    it("should infer the right type", () => {
      expectType<InferResultType<typeof qWithZod>>().toStrictEqual<
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
      const qErr = qVariants.project({
        id: q.string().default("DEFAULT"),
      });
      expectType<InferResultType<typeof qErr>>().toStrictEqual<
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

      // Sometimes the error is embedded in the results:
      const qRes = qVariants.project({
        id: q.string(),
      });
      expectType<InferResultType<typeof qRes>>().toStrictEqual<
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
      expectType<InferResultType<typeof qNormal>>().toStrictEqual<
        Array<{
          id: string | null;
        }>
      >();

      const query = qVariants.project({
        id: q.default(q.string(), "DEFAULT"),
      });
      expectType<InferResultType<typeof query>>().toStrictEqual<
        Array<{
          id: string;
        }>
      >();
    });
  });

  describe("zod input widening", () => {
    const qVariant = qVariants.slice(0);
    it("should complain if the parser's input is narrower than the input", () => {
      // First, show that `id` is optional/nullable
      const qResultNormal = qVariant.project({ id: true });
      expectType<InferResultType<typeof qResultNormal>>().toStrictEqual<{
        id: string | null;
      }>();

      // Now, let's pick `id` with a narrow parser:
      const qResult = qVariant.project({ id: q.string() });
      // Ensure we return an error result:
      expectType<InferResultType<typeof qResult>>().toStrictEqual<{
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
      expectType<InferResultType<typeof qName>>().toStrictEqual<
        Array<{
          name: string;
        }>
      >();

      // Now let's use a parser that allows for string | null:
      const qWideParser = qVariant.project({
        name: q.string().nullable(),
      });
      expectType<InferResultType<typeof qWideParser>>().toStrictEqual<{
        name: string | null;
      }>();
    });
  });
});
