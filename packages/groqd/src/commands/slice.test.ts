import { describe, it, expect, beforeAll, expectTypeOf } from "vitest";
import { SanitySchema, q } from "../tests/schemas/nextjs-sanity-fe";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { InferResultType } from "../groq-builder";

describe("slice", () => {
  const qVariants = q.star.filterByType("variant");
  const data = mock.generateSeedData({
    variants: mock.array(10, () => mock.variant({})),
  });
  beforeAll(async function checkRootQuery() {
    const results = await executeBuilder(qVariants, data);
    expect(results).toStrictEqual(data.variants);
  });

  describe("a single item", () => {
    const qSlice0 = qVariants.slice(0);
    it("should be typed correctly", () => {
      expectTypeOf<
        InferResultType<typeof qSlice0>
      >().toEqualTypeOf<SanitySchema.Variant | null>();
    });
    it("query should be correct", () => {
      expect(qSlice0).toMatchObject({
        query: '*[_type == "variant"][0]',
      });
    });
    it("should execute correctly", async () => {
      const results = await executeBuilder(qSlice0, data);
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
      const qSlice = qVariants.slice(5, 10, true);
      expect(qSlice.query).toMatchInlineSnapshot(
        `"*[_type == "variant"][5..10]"`
      );
    });
    it("query should be correct with exclusive ...", () => {
      const qSlice = qVariants.slice(5, 10);
      expect(qSlice.query).toMatchInlineSnapshot(
        `"*[_type == "variant"][5...10]"`
      );
    });
    it("should execute correctly", async () => {
      const qSlice = qVariants.slice(5, 7);
      const results = await executeBuilder(qSlice, data);
      expect(results).toMatchObject([
        // Triple-dots is exclusive
        data.variants[5],
        data.variants[6],
      ]);
    });
  });
});
