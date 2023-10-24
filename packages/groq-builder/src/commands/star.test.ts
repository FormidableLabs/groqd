import { describe, it, expect } from "vitest";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { ExtractScope } from "../utils/common-types";
import { createGroqBuilder } from "../index";

const q = createGroqBuilder<SchemaConfig>();

describe("star", () => {
  const result = q.star;

  it("should have the correct type, matching all documents", () => {
    expectType<ExtractScope<typeof result>>().toStrictEqual<
      Array<SchemaConfig["documentTypes"]>
    >();
  });
  it("the query should be '*'", () => {
    expect(result).toMatchObject({
      query: "*",
    });
  });
});
