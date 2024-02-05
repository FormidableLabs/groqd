import { describe, expectTypeOf, it } from "vitest";
import {
  ExtractTypeMismatchErrors,
  TypeMismatchError,
  UndefinedToNull,
} from "./utils";

describe("ExtractTypeMismatchErrors", () => {
  type TME<ErrorMessage extends string> = TypeMismatchError<{
    error: ErrorMessage;
    expected: unknown;
    actual: unknown;
  }>;

  type Valid = { FOO: "FOO" };

  it("should find nested errors", () => {
    type TestObject = {
      FOO: TME<"foo-error">;
      BAR: TME<"bar-error">;
      BAZ: Valid;
    };
    expectTypeOf<ExtractTypeMismatchErrors<TestObject>>().toEqualTypeOf<
      | 'Error in "FOO": foo-error'
      //
      | 'Error in "BAR": bar-error'
    >();
  });
  it("should return 'never' when there's no errors", () => {
    expectTypeOf<ExtractTypeMismatchErrors<Valid>>().toEqualTypeOf<never>();
    expectTypeOf<ExtractTypeMismatchErrors<undefined>>().toEqualTypeOf<never>();
    expectTypeOf<ExtractTypeMismatchErrors<null>>().toEqualTypeOf<never>();
  });
});

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
