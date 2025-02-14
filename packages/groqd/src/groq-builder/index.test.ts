import { describe, expect, expectTypeOf, it } from "vitest";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { InferResultType } from "../types/public-types";
import { Empty, StringKeys } from "../types/utils";
import { getSubquery } from "../tests/getSubquery";
import { createGroqBuilderLite } from "../index";

const q = createGroqBuilderLite<SchemaConfig>();

type CoreKeys = "query" | "parser" | "parse";

describe("GroqBuilderRoot", () => {
  it("root should have an Empty result", () => {
    expectTypeOf<InferResultType<typeof q>>().toEqualTypeOf<Empty>();
  });
  it("should have an empty query", () => {
    expect(q.query).toEqual("");
  });
  it("should only expose methods appropriate for the root", () => {
    type ExpectedRootKeys =
      // Root Queries:
      | "star"
      | "project"
      | "raw"
      // Utils:
      | "value"
      | "parameters"
      | "variables"
      | "fragment"
      | "fragmentForType"
      | "as"
      | "asType"
      // Legacy:
      | "grab"
      | "grab$"
      | "grabOne"
      | "grabOne$";
    type ActualKeys = Exclude<StringKeys<keyof typeof q>, CoreKeys>;

    type MissingKeys = Exclude<ActualKeys, ExpectedRootKeys>;
    expectTypeOf<MissingKeys>().toEqualTypeOf<never>();
    expectTypeOf<ActualKeys>().toEqualTypeOf<ExpectedRootKeys>();
  });
});
describe("GroqBuilderSubquery", () => {
  const sub = getSubquery(q).asType<"variant" | "product">();

  it("should have an empty query", () => {
    expect(sub.query).toEqual("");
  });
  it("should only expose methods appropriate for the subquery", () => {
    type ActualKeys = Exclude<StringKeys<keyof typeof sub>, CoreKeys>;
    type ExpectedKeys =
      // General Utilities:
      | "as"
      | "asType"
      | "raw"
      // Subquery utils:
      | "conditional"
      | "conditionalByType"
      | "select"
      | "selectByType"
      // Subquery queries:
      | "field"
      | "project"
      | "projectNaked"
      | "projectField"
      // Legacy:
      | "grab"
      | "grab$"
      | "grabOne"
      | "grabOne$";
    type MissingKeys = Exclude<ActualKeys, ExpectedKeys>;
    expectTypeOf<MissingKeys>().toEqualTypeOf<never>();
    expectTypeOf<ActualKeys>().toEqualTypeOf<ExpectedKeys>();
  });
});
