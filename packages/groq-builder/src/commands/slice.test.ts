import { describe, it, expect, beforeAll } from "vitest";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { ExtractScope } from "../utils/common-types";
import { createGroqBuilder } from "../index";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";

const q = createGroqBuilder<SchemaConfig>();

describe("slice", () => {
  const qVariants = q.star.filterByType("variant");
  const data = mock.generateSeedData();
  beforeAll(async function checkRootQuery() {
    const results = await executeBuilder(data.datalake, qVariants);
    expect(results).toStrictEqual(data.variants);
  });

  describe("a single item", () => {
    const qSlice0 = qVariants.slice(0);
    it("should be typed correctly", () => {
      expectType<
        ExtractScope<typeof qSlice0>
      >().toStrictEqual<SanitySchema.Variant>();
    });
    it("query should be correct", () => {
      expect(qSlice0).toMatchObject({
        query: '*[_type == "variant"][0]',
      });
    });
    it("should execute correctly", async () => {
      const results = await executeBuilder(data.datalake, qSlice0);
      expect(results).toMatchObject(data.variants[0]);
    });
  });
  describe("a range", () => {
    it("invalid types should be caught", () => {
      // @ts-expect-error ---
      qVariants.slice("5.....10");
      // @ts-expect-error ---
      qVariants.slice("5.10");
      // @ts-expect-error ---
      qVariants.slice("510");
    });
    it("query should be correct with inclusive ..", () => {
      const qSlice = qVariants.slice("5..10");
      expect(qSlice.query).toMatchInlineSnapshot(
        '"*[_type == \\"variant\\"][5..10]"'
      );
    });
    it("query should be correct with exclusive ...", () => {
      const qSlice = qVariants.slice("5...10");
      expect(qSlice.query).toMatchInlineSnapshot(
        '"*[_type == \\"variant\\"][5...10]"'
      );
    });
    it("should execute correctly", async () => {
      const qSlice = qVariants.slice("5...7");
      const results = await executeBuilder(data.datalake, qSlice);
      expect(results).toMatchObject([
        // Triple-dots is exclusive
        data.variants[5],
        data.variants[6],
      ]);
    });
  });
});
