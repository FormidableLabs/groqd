import { describe, expectTypeOf, it } from "vitest";
import {
  ExtractTypeMismatchErrors,
  RequireAFakeParameterIfThereAreTypeMismatchErrors,
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

    type Result = ExtractTypeMismatchErrors<TestObject>;

    expectTypeOf<Result>().toEqualTypeOf<
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

describe("RequireAFakeParameterIfThereAreTypeMismatchErrors", () => {
  type NoErrors = {
    foo: "foo";
    bar: "bar";
  };
  type WithErrors = {
    foo: "foo";
    invalid: TypeMismatchError<{
      error: "ERROR";
      expected: "EXPECTED";
      actual: "ACTUAL";
    }>;
  };
  it("should return an empty parameter list when there are no errors", () => {
    type Params = RequireAFakeParameterIfThereAreTypeMismatchErrors<NoErrors>;
    expectTypeOf<Params>().toEqualTypeOf<[]>();
  });
  it("should return errors in the parameter list when there are errors", () => {
    type Params = RequireAFakeParameterIfThereAreTypeMismatchErrors<WithErrors>;
    expectTypeOf<Params>().toEqualTypeOf<
      | ["⛔️ Error: this projection has type mismatches: ⛔️"]
      | ['Error in "invalid": ERROR']
    >();
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
