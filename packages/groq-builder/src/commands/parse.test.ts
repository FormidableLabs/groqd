import { describe, it, expect } from "vitest";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { ExtractScope } from "../utils/common-types";
import { createGroqBuilder } from "../index";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";

const q = createGroqBuilder<SchemaConfig>();
const qVariants = q.star.filterByType("variant");

describe("parse", () => {
  const data = mock.generateSeedData({
    variants: [mock.variant({ price: 99 })],
  });
  const qPrice = qVariants.slice(0).projection("price");

  function currencyFormat(price: number): string {
    return `$${price.toFixed(2)}`;
  }
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
  describe("parser object", () => {
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
