import { describe, it, expectTypeOf } from "vitest";
import { ProjectionPaths } from "./projection-paths";

describe("projection-paths", () => {
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
