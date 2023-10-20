import { describe, it, expect } from "vitest";
import { createGroqBuilder } from "../groq-builder";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { ExtractScope } from "../utils/common-types";
import { ExtractDocumentTypes } from "../utils/schema-types";

const q = createGroqBuilder<SchemaConfig>();

describe("star", () => {
  it("", () => {
    const res = q.star;
    type AllDocumentTypes = ExtractDocumentTypes<SchemaConfig>;
    expectType<ExtractScope<typeof res>>().toStrictEqual<AllDocumentTypes>();

    expect(res).toMatchObject({
      query: "*",
    });
  });
});
