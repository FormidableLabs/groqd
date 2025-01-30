import { describe, expectTypeOf, it } from "vitest";
import { JustOneOf, UndefinedToNull } from "./utils";

describe("UndefinedToNull", () => {
  it("should cast undefined or optional properties to null", () => {
    type Foo = "Foo";
    expectTypeOf<
      UndefinedToNull<Foo | undefined>
    >().toEqualTypeOf<Foo | null>();
    expectTypeOf<UndefinedToNull<Foo | null>>().toEqualTypeOf<Foo | null>();
    expectTypeOf<
      UndefinedToNull<Foo | null | undefined>
    >().toEqualTypeOf<Foo | null>();
    expectTypeOf<UndefinedToNull<Foo>>().toEqualTypeOf<Foo>();
  });
  it("should cast optional properties to null", () => {
    type Foo = { Foo?: "FOO" };
    expectTypeOf<Foo["Foo"]>().toEqualTypeOf<"FOO" | undefined>();
    expectTypeOf<UndefinedToNull<Foo["Foo"]>>().toEqualTypeOf<"FOO" | null>();
  });
});
describe("JustOneOf", () => {
  it("should extract just one element of a union", () => {
    // All of these seem "stable", but tread carefully!
    expectTypeOf<JustOneOf<1 | 2 | 3>>().toEqualTypeOf<3>();
    expectTypeOf<JustOneOf<3 | 2 | 1>>().toEqualTypeOf<3>();
    expectTypeOf<JustOneOf<string | number>>().toEqualTypeOf<number>();
    expectTypeOf<JustOneOf<number | string>>().toEqualTypeOf<number>();
    expectTypeOf<JustOneOf<"a" | "b" | "c">>().toEqualTypeOf<"c">();
    expectTypeOf<JustOneOf<"c" | "b" | "a">>().toEqualTypeOf<"c">();
  });
});
