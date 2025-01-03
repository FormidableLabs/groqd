import { describe, it, expect, expectTypeOf } from "vitest";
import { SchemaConfig, q } from "../tests/schemas/nextjs-sanity-fe";
import { InferResultType } from "../types/public-types";
import { SchemaDocument } from "../index";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";

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

  describe("execution", () => {
    it("should retrieve all documents", async () => {
      const data = mock.generateSeedData({});
      const result = await executeBuilder(q.star, data);

      // I mean, this should be sufficient, right?
      expect(result).toEqual(data.datalake);
    });
  });
});
