import { describe, expectTypeOf, it } from "vitest";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { getSubquery } from "../tests/getSubquery";

import { createGroqBuilderLite } from "../index";

const q = createGroqBuilderLite<SchemaConfig>({ indent: "" });

describe("GroqBuilderRoot", () => {
  it("should only expose methods appropriate for the root", () => {
    type ExpectedRootKeys =
      // Root Queries:
      | "star"
      | "project"
      | "raw"
      | "count"
      | "coalesce"
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
    type ActualKeys = keyof typeof q;

    type MissingKeys = Exclude<ActualKeys, ExpectedRootKeys>;
    expectTypeOf<MissingKeys>().toEqualTypeOf<never>();
    expectTypeOf<ActualKeys>().toEqualTypeOf<ExpectedRootKeys>();
  });
});
describe("GroqBuilderSubquery", () => {
  const sub = getSubquery(q).asType<"variant" | "product">();

  it("should only expose methods appropriate for the subquery", () => {
    type ActualKeys = keyof typeof sub;
    type ExpectedKeys =
      // General Utilities:
      | "as"
      | "asType"
      | "asCombined"
      | "raw"
      // Subquery utils:
      | "count"
      | "coalesce"
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
