import { describe, it, expect, expectTypeOf } from "vitest";
import { SanitySchema, q } from "../tests/schemas/nextjs-sanity-fe";
import { InferResultType } from "../types/public-types";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";

const data = mock.generateSeedData({});

describe("filterByType", () => {
  const qProduct = q.star.filterByType("product");
  it("types should be correct", () => {
    expectTypeOf<InferResultType<typeof qProduct>>().toEqualTypeOf<
      Array<SanitySchema.Product>
    >();
  });
  it("invalid types should be caught", () => {
    // @ts-expect-error ---
    q.star.filterByType("INVALID");
  });
  it("query should be correct", () => {
    expect(qProduct).toMatchObject({
      query: `*[_type == "product"]`,
    });
  });

  it("should execute correctly", async () => {
    const results = await executeBuilder(qProduct, data);
    expect(results).toEqual(data.products);
  });

  describe("multiple types", () => {
    const qMulti = q.star.filterByType("product", "variant");
    type MultiResult = InferResultType<typeof qMulti>;
    it("should have the correct type", () => {
      expectTypeOf<MultiResult>().toEqualTypeOf<
        Array<SanitySchema.Product | SanitySchema.Variant>
      >();
    });
    it("query should be correct", () => {
      expect(qMulti).toMatchObject({
        query: `*[_type == "product" || _type == "variant"]`,
      });
    });
  });
});
