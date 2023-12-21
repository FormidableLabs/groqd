import { describe, it, expect } from "vitest";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { createGroqBuilder, InferResultType } from "../index";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { currencyFormat } from "../tests/utils";
import { expectType } from "../tests/expectType";

const q = createGroqBuilder<SchemaConfig>();
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
      const result = await executeBuilder(qPriceParse, data.datalake);
      expect(result).toMatchInlineSnapshot('"$99.00"');
    });

    it("should map types correctly", () => {
      expectType<InferResultType<typeof qPrice>>().toStrictEqual<number>();
      expectType<InferResultType<typeof qPriceParse>>().toStrictEqual<string>();
    });
  });
  describe("Zod-like parser object", () => {
    const qPriceParse = qPrice.validate({ parse: (p) => currencyFormat(p) });

    it("shouldn't affect the query at all", () => {
      expect(qPriceParse.query).toEqual(qPrice.query);
    });

    it("should parse the data", async () => {
      const result = await executeBuilder(qPriceParse, data.datalake);
      expect(result).toMatchInlineSnapshot('"$99.00"');
    });
  });
});
