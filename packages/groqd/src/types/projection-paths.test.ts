import { describe, it, expectTypeOf } from "vitest";
import {
  ProjectionPathEntries,
  ProjectionPaths,
  ProjectionPathValue,
  ValuesAsArrays,
} from "./projection-paths";

type TestObject = {
  a: "A";
  b: { c: "C" };
  d: { e: { f: 0 } };
  g: Array<{ h: Array<{ i: "I" }> }>;
};

describe("ProjectionPaths", () => {
  it("primitive types should not be traversed", () => {
    expectTypeOf<ProjectionPaths<string>>().toEqualTypeOf<never>();
    expectTypeOf<ProjectionPaths<number>>().toEqualTypeOf<never>();
    expectTypeOf<ProjectionPaths<boolean>>().toEqualTypeOf<never>();
    expectTypeOf<ProjectionPaths<symbol>>().toEqualTypeOf<never>();
    expectTypeOf<ProjectionPaths<any>>().toEqualTypeOf<never>();
  });

  it("should generate shallow paths for simple types", () => {
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
  it("should not allow invalid keys", () => {
    type _INVALID = ProjectionPathValue<
      TestObject,
      // @ts-expect-error ---
      "INVALID"
    >;
  });
  it("should return the correct type for simple paths", () => {
    expectTypeOf<ProjectionPathValue<TestObject, "a">>().toEqualTypeOf<"A">();
    expectTypeOf<ProjectionPathValue<TestObject, "b">>().toEqualTypeOf<{
      c: "C";
    }>();
  });

  it("should return the correct type from deep paths", () => {
    expectTypeOf<ProjectionPathValue<TestObject, "b.c">>().toEqualTypeOf<"C">();
    expectTypeOf<ProjectionPathValue<TestObject, "d.e.f">>().toEqualTypeOf<0>();
  });

  it("should return the correct types from array paths", () => {
    expectTypeOf<ProjectionPathValue<TestObject, "g">>().toEqualTypeOf<
      Array<{ h: Array<{ i: "I" }> }>
    >();
    expectTypeOf<ProjectionPathValue<TestObject, "g[]">>().toEqualTypeOf<
      Array<{ h: Array<{ i: "I" }> }>
    >();
    expectTypeOf<ProjectionPathValue<TestObject, "g[].h">>().toEqualTypeOf<
      Array<Array<{ i: "I" }>>
    >();
    expectTypeOf<ProjectionPathValue<TestObject, "g[].h[]">>().toEqualTypeOf<
      Array<Array<{ i: "I" }>>
    >();
    expectTypeOf<ProjectionPathValue<TestObject, "g[].h[].i">>().toEqualTypeOf<
      Array<Array<"I">>
    >();
  });
});

describe("ProjectionPathEntries", () => {
  it("simple types", () => {
    expectTypeOf<
      ProjectionPathEntries<{
        a: "A";
        b: "B";
      }>
    >().toEqualTypeOf<{
      a: "A";
      b: "B";
    }>();
  });
  it("nested objects get flattened", () => {
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
  it("arrays get square braces", () => {
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
