import { describe, expectTypeOf, it } from "vitest";
import { UndefinedToNull } from "./utils";

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
