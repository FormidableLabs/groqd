import { describe, it, expect } from "vitest";
import { createGroqBuilder } from "../groq-builder";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { ExtractScope } from "../utils/common-types";

const q = createGroqBuilder<SchemaConfig>();

describe("filterBy", () => {
  it("", () => {
    const res = q.star.filterBy<"_type", "flavour">(`_type == "flavour"`);
    expectType<ExtractScope<typeof res>>().toStrictEqual<
      Array<SanitySchema["flavour"]>
    >();
    expect(q).toMatchObject({
      query: `[_type == "flavour"]`,
    });
  });
});

describe("filterByType", () => {
  it("", () => {
    const res = q.star.filterByType("flavour");
    expectType<ExtractScope<typeof res>>().toStrictEqual<
      Array<SanitySchema["flavour"]>
    >();
    expect(q).toMatchObject({
      query: `*[_type == "flavour"]`,
    });
  });
});
