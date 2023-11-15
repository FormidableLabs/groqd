import { describe, it, expect } from "vitest";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { QueryResultType } from "../types/common-types";
import { createGroqBuilder } from "../index";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";

const q = createGroqBuilder<SchemaConfig>();

const data = mock.generateSeedData({});

describe("filterBy", () => {
  const qProduct = q.star.filterBy(`_type == "product"`);

  it("types should be correct", () => {
    expectType<QueryResultType<typeof qProduct>>().toStrictEqual<
      Array<SanitySchema.Product>
    >();
    expectType<QueryResultType<typeof qProduct>>().not.toStrictEqual<
      Array<SanitySchema.Variant>
    >();
  });

  it("invalid types should be caught", () => {
    // @ts-expect-error ---
    q.star.filterBy(`INVALID == "product"`);
    // @ts-expect-error ---
    q.star.filterBy(`_type == "INVALID"`);
  });

  it("query should be correct", () => {
    expect(qProduct).toMatchObject({
      query: `*[_type == "product"]`,
    });
  });

  it("should execute correctly", async () => {
    const results = await executeBuilder(data.datalake, qProduct);
    expect(results).toEqual(data.products);
  });
});

describe("filterByType", () => {
  const qProduct = q.star.filterByType("product");
  it("types should be correct", () => {
    expectType<QueryResultType<typeof qProduct>>().toStrictEqual<
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
    const results = await executeBuilder(data.datalake, qProduct);
    expect(results).toEqual(data.products);
  });
});
