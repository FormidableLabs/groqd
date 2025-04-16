import { describe, it, expect, expectTypeOf } from "vitest";
import {
  SchemaConfig,
  q,
  SanitySchema,
} from "../../tests/schemas/nextjs-sanity-fe";
import { SchemaDocument } from "../../types/document-types";
import { executeBuilder } from "../../tests/mocks/executeQuery";
import { mock } from "../../tests/mocks/nextjs-sanity-fe-mocks";
import { InferResultType } from "../../groq-builder";

describe("star", () => {
  const star = q.star;

  it("should have the correct type, matching all documents", () => {
    type SchemaDocs = Extract<SchemaConfig["schemaTypes"], SchemaDocument>;
    expectTypeOf<InferResultType<typeof star>>().toEqualTypeOf<
      Array<SchemaDocs>
    >();
  });
  it("the query should be '*'", () => {
    expect(star).toMatchObject({
      query: "*",
    });
  });
  it("sub-queries can be started with '*'", () => {
    const subQuery = q.star.filterByType("category").project((sub) => ({
      products: sub.star.filterByType("product").filterBy("references(^._id)"),
    }));
    expectTypeOf<InferResultType<typeof subQuery>>().toEqualTypeOf<
      Array<{
        products: Array<SanitySchema.Product>;
      }>
    >();
  });

  describe("execution", () => {
    it("should retrieve all documents", async () => {
      const data = mock.generateSeedData({});
      const result = await executeBuilder(q.star, data);

      // I mean, this should be sufficient, right?
      expect(result).toEqual(data.datalake);
    });
  });
});
