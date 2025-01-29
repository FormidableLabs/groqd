import { describe, expectTypeOf, it } from "vitest";
import {
  ExtractTypeMismatchErrors,
  RequireAFakeParameterIfThereAreTypeMismatchErrors,
  TypeMismatchError,
} from "./type-mismatch-error";

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
      BAZ: Valid | TME<"baz-error">;
      BAT: Valid;
    };

    type Result = ExtractTypeMismatchErrors<TestObject>;

    expectTypeOf<Result>().toEqualTypeOf<
      | 'Error in "FOO": foo-error'
      | 'Error in "BAR": bar-error'
      | 'Error in "BAZ": baz-error'
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
    alsoInvalid:
      | string
      | TypeMismatchError<{
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
      | ['Error in "invalid": ERROR' | 'Error in "alsoInvalid": ERROR']
    >();
  });
});
