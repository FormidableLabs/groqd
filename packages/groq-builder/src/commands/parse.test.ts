import { describe, it, expect } from "vitest";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { createGroqBuilder } from "../index";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { currencyFormat } from "../tests/utils";

const q = createGroqBuilder<SchemaConfig>();
const qVariants = q.star.filterByType("variant");

describe("parse", () => {
  const data = mock.generateSeedData({
    variants: [mock.variant({ price: 99 })],
  });
  const qPrice = qVariants.slice(0).projection("price");

  describe("parser function", () => {
    const qPriceParse = qPrice.parse((p) => currencyFormat(p));

    it("shouldn't affect the query at all", () => {
      expect(qPriceParse.query).toEqual(qPrice.query);
    });

    it("should parse the data", async () => {
      const result = await executeBuilder(data.datalake, qPriceParse);
      expect(result).toMatchInlineSnapshot('"$99.00"');
    });
  });
  describe("zod-like parser object", () => {
    const qPriceParse = qPrice.parse({ parse: (p) => currencyFormat(p) });

    it("shouldn't affect the query at all", () => {
      expect(qPriceParse.query).toEqual(qPrice.query);
    });

    it("should parse the data", async () => {
      const result = await executeBuilder(data.datalake, qPriceParse);
      expect(result).toMatchInlineSnapshot('"$99.00"');
    });
  });
});
