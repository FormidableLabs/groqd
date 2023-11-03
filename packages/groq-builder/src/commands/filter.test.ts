import { describe, it, expect } from "vitest";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { ExtractScope } from "../utils/common-types";
import { createGroqBuilder } from "../index";

const q = createGroqBuilder<SchemaConfig>();

describe("filterBy", () => {
  const result = q.star.filterBy(`_type == "flavour"`);

  it("types should be correct", () => {
    expectType<ExtractScope<typeof result>>().toStrictEqual<
      Array<SanitySchema.Flavour>
    >();
    expectType<ExtractScope<typeof result>>().not.toStrictEqual<
      Array<SanitySchema.Variant>
    >();
  });

  it("invalid types should be caught", () => {
    // @ts-expect-error ---
    q.star.filterBy(`INVALID == "flavour"`);
    // @ts-expect-error ---
    q.star.filterBy(`_type == "INVALID"`);
  });

  it("query should be correct", () => {
    expect(result).toMatchObject({
      query: `*[_type == "flavour"]`,
    });
  });
});

describe("filterByType", () => {
  const result = q.star.filterByType("flavour");
  it("types should be correct", () => {
    expectType<ExtractScope<typeof result>>().toStrictEqual<
      Array<SanitySchema.Flavour>
    >();
  });
  it("invalid types should be caught", () => {
    // @ts-expect-error ---
    q.star.filterByType("INVALID");
  });
  it("query should be correct", () => {
    expect(result).toMatchObject({
      query: `*[_type == "flavour"]`,
    });
  });
});
