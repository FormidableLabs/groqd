import { describe, expect, expectTypeOf, it } from "vitest";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { createGroqBuilderWithZod, InferResultType } from "../index";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { currencyFormat } from "../tests/utils";

const q = createGroqBuilderWithZod<SchemaConfig>();
const qVariants = q.star.filterByType("variant");

describe("parse", () => {
  const data = mock.generateSeedData({
    variants: [mock.variant({ price: 99 })],
  });
  const qPrice = qVariants.slice(0).field("price");

  describe("parser function", () => {
    const qPriceParse = qPrice.validate((p) => currencyFormat(p));

    it("shouldn't affect the query at all", () => {
      expect(qPriceParse.query).toEqual(qPrice.query);
    });

    it("should parse the data", async () => {
      const result = await executeBuilder(qPriceParse, data);
      expect(result).toMatchInlineSnapshot('"$99.00"');
    });

    it("should map types correctly", () => {
      expectTypeOf<InferResultType<typeof qPrice>>().toEqualTypeOf<number>();
      expectTypeOf<
        InferResultType<typeof qPriceParse>
      >().toEqualTypeOf<string>();
    });
  });
  describe("Zod parsers", () => {
    const qPriceParse = qPrice.validate<string>(
      q.number().transform((p) => currencyFormat(p))
    );

    it("shouldn't affect the query at all", () => {
      expect(qPriceParse.query).toEqual(qPrice.query);
    });

    it("should parse the data", async () => {
      const result = await executeBuilder(qPriceParse, data);
      expect(result).toMatchInlineSnapshot('"$99.00"');
    });
  });
});
