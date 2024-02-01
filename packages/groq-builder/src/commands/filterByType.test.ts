import { describe, it, expect, expectTypeOf } from "vitest";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { InferResultType } from "../types/public-types";
import { createGroqBuilder } from "../index";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";

const q = createGroqBuilder<SchemaConfig>();

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
    const results = await executeBuilder(qProduct, data.datalake);
    expect(results).toEqual(data.products);
  });
});
