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
    });

    it("should infer the right type", () => {
      expectType<InferResultType<typeof qWithZod>>().toStrictEqual<
        Array<{
          name: string;
          price: number;
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
            "id": undefined,
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
      qVariants.project({
        // @ts-expect-error --- 'string | undefined' is not assignable to 'string | null'
        id: q.string().default("DEFAULT"),
      });

      // Sometimes the error is embedded in the results:
      const qRes = qVariants.project({
        id: q.string(),
      });
      expectType<InferResultType<typeof qRes>>().toStrictEqual<
        Array<{
          id: TypeMismatchError<{
            error: "⛔️ Parser expects a different input type ⛔️";
            expected: string;
            actual: string | null;
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
  /*
  describe("zod input widening", () => {
    it("shouldn't complain if the parser's input is wider than the input", () => {
      // FIrst, show that `name` is just a required string:
      const qName = qVariants.project({ name: true });
      expectType<InferResultType<typeof qName>>().toStrictEqual<
        Array<{
          name: string;
        }>
      >();
      // Let's use a parser that allows for string | null:
      const qWideParser = qVariants.project({
        name: q.string().nullable(),
      });

      expectType<InferResultType<typeof qWideParser>>().toStrictEqual<
        Array<{
          name: string | null;
        }>
      >();
    });
  });
   */
});
