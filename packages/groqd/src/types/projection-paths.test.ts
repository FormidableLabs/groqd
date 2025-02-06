import { describe, it, expectTypeOf } from "vitest";
import {
  _ProjectionPathEntries,
  ProjectionPathEntries,
  ProjectionPaths,
  ProjectionPathValue,
  ValuesAsArrays,
} from "./projection-paths";

type TestObject = {
  a: "A";
  b: { c: "C" };
  d: { e: { f: 0 } };
};

describe("ProjectionPaths", () => {
  it("primitive types should not be traversed", () => {
    expectTypeOf<ProjectionPaths<string>>().toEqualTypeOf<"">();
    expectTypeOf<ProjectionPaths<number>>().toEqualTypeOf<"">();
    expectTypeOf<ProjectionPaths<boolean>>().toEqualTypeOf<"">();
    expectTypeOf<ProjectionPaths<symbol>>().toEqualTypeOf<"">();
    expectTypeOf<ProjectionPaths<any>>().toEqualTypeOf<"">();
  });

  it("should generate shallow paths for simple types", () => {
    expectTypeOf<ProjectionPaths<{ a: {} }>>().toEqualTypeOf<"a">();
    expectTypeOf<ProjectionPaths<{ a: "A" }>>().toEqualTypeOf<"a">();
    expectTypeOf<ProjectionPaths<{ a: null }>>().toEqualTypeOf<"a">();
    expectTypeOf<ProjectionPaths<{ a: string }>>().toEqualTypeOf<"a">();
    expectTypeOf<ProjectionPaths<{ a: number }>>().toEqualTypeOf<"a">();
    expectTypeOf<ProjectionPaths<{ a: any }>>().toEqualTypeOf<"a">();
  });

  it("should generate keys for deep objects", () => {
    expectTypeOf<ProjectionPaths<{ a: { b: "B" } }>>().toEqualTypeOf<
      "a" | "a.b"
    >();

    expectTypeOf<ProjectionPaths<{ a: { b: { c: "C" } } }>>().toEqualTypeOf<
      "a" | "a.b" | "a.b.c"
    >();
  });

  it("should generate keys for array types", () => {
    expectTypeOf<ProjectionPaths<{ a: [] }>>().toEqualTypeOf<"a" | "a[]">();
    expectTypeOf<ProjectionPaths<{ a: Array<{ b: "B" }> }>>().toEqualTypeOf<
      "a" | "a[]" | "a[].b"
    >();
    expectTypeOf<
      ProjectionPaths<{ a: Array<{ b: Array<{ c: "C" }> }> }>
    >().toEqualTypeOf<
      | "a"
      ///
      | "a[]"
      | "a[].b"
      | "a[].b[]"
      | "a[].b[].c"
    >();
    expectTypeOf<
      ProjectionPaths<{ a: Array<Array<{ b: "B" }>> }>
    >().toEqualTypeOf<
      | "a"
      ///
      | "a[]"
      | "a[][].b"
      | "a[][]"
    >();
  });
});
describe("ProjectionPathValue", () => {
  type _INVALID = ProjectionPathValue<
    TestObject,
    // @ts-expect-error ---
    "INVALID"
  >;

  expectTypeOf<ProjectionPathValue<TestObject, "a">>().toEqualTypeOf<"A">();
  expectTypeOf<ProjectionPathValue<TestObject, "b">>().toEqualTypeOf<{
    c: "C";
  }>();
  expectTypeOf<ProjectionPathValue<TestObject, "b.c">>().toEqualTypeOf<"C">();
  expectTypeOf<ProjectionPathValue<TestObject, "d.e.f">>().toEqualTypeOf<0>();
});

describe("ProjectionPathEntries", () => {
  it("simple types", () => {
    expectTypeOf<
      ProjectionPathEntries<{
        a: "A";
      }>
    >().toEqualTypeOf<{ a: "A" }>();
  });

  it("nested objects", () => {
    expectTypeOf<
      ProjectionPathEntries<{
        a: "A";
        b: { c: "C" };
      }>
    >().toEqualTypeOf<{
      a: "A";
      b: { c: "C" };
      "b.c": "C";
    }>();
    expectTypeOf<
      ProjectionPathEntries<{
        a: { b: { c: "D" } };
      }>
    >().toEqualTypeOf<{
      a: { b: { c: "D" } };
      "a.b": { c: "D" };
      "a.b.c": "D";
    }>();
  });
  it("arrays", () => {
    expectTypeOf<
      ProjectionPathEntries<{
        a: Array<string>;
      }>
    >().toEqualTypeOf<{
      a: Array<string>;
      "a[]": Array<string>;
    }>();

    expectTypeOf<
      ProjectionPathEntries<{
        a: Array<{ foo: "FOO" }>;
      }>
    >().toEqualTypeOf<{
      a: Array<{ foo: "FOO" }>;
      "a[]": Array<{ foo: "FOO" }>;
      "a[].foo": Array<"FOO">;
    }>();
  });
});

expectTypeOf<
  ValuesAsArrays<{
    "a.b": string;
    "b.c": { foo: "FOO" };
  }>
>().toEqualTypeOf<{
  "a.b": string[];
  "b.c": Array<{ foo: "FOO" }>;
}>();
