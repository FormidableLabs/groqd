import { describe, it } from "vitest";
import { expectType } from "../tests/expectType";
import { ExtractTypeMismatchErrors, TypeMismatchError } from "./utils";

describe("ExtractTypeMismatchErrors", () => {
  type TME<ErrorMessage extends string> = TypeMismatchError<{
    error: ErrorMessage;
    expected: unknown;
    actual: unknown;
  }>;

  type TestError = TME<"pass-through">;
  type Valid = { FOO: "FOO" };

  it("should pass-through errors", () => {
    expectType<
      ExtractTypeMismatchErrors<TestError>
    >().toStrictEqual<TestError>();

    expectType<
      ExtractTypeMismatchErrors<TestError | undefined>
    >().toStrictEqual<TestError>();

    expectType<
      ExtractTypeMismatchErrors<TestError | Valid>
    >().toStrictEqual<TestError>();
  });
  it("should find nested errors", () => {
    type TestObject = {
      FOO: TME<"foo-error">;
      BAR: TME<"bar-error">;
      BAZ: Valid;
    };
    expectType<ExtractTypeMismatchErrors<TestObject>["error"]>().toStrictEqual<
      | "The following property had a nested error: FOO"
      | "The following property had a nested error: BAR"
    >();
  });
  it("should return 'never' when there's no errors", () => {
    expectType<ExtractTypeMismatchErrors<Valid>>().toStrictEqual<never>();
    expectType<ExtractTypeMismatchErrors<undefined>>().toStrictEqual<never>();
    expectType<ExtractTypeMismatchErrors<null>>().toStrictEqual<never>();
  });
});
