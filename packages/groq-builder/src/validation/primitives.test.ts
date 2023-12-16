import { describe, expect, it } from "vitest";
import { validate } from "./index";
import { expectType } from "../tests/expectType";
import { InferParserInput, InferParserOutput } from "../types/public-types";
import { ValidationErrors } from "./validation-errors";

describe("primitiveValidators", () => {
  it("string", () => {
    const str = validate.string();

    expect(str("TEST")).toEqual("TEST");
    const validResult = str("TEST");
    expectType<typeof validResult>().toStrictEqual<string>();

    // @ts-expect-error ---
    expect(() => str(undefined)).toThrowErrorMatchingInlineSnapshot(
      '"Expected string, received undefined"'
    );
    // @ts-expect-error ---
    expect(() => str(null)).toThrowErrorMatchingInlineSnapshot(
      '"Expected string, received null"'
    );
    // @ts-expect-error ---
    expect(() => str(123)).toThrowErrorMatchingInlineSnapshot(
      '"Expected string, received 123"'
    );
    // @ts-expect-error ---
    expect(() => str({})).toThrowErrorMatchingInlineSnapshot(
      '"Expected string, received an object"'
    );
    // @ts-expect-error ---
    expect(() => str([])).toThrowErrorMatchingInlineSnapshot(
      '"Expected string, received an Array"'
    );
  });
  it("string.optional", () => {
    const str = validate.string().optional();

    expect(str("TEST")).toEqual("TEST");
    expect(str(undefined)).toEqual(undefined);
    expect(str(null)).toEqual(null);

    // @ts-expect-error ---
    expect(() => str(123)).toThrowErrorMatchingInlineSnapshot(
      '"Expected string, received 123"'
    );
    // @ts-expect-error ---
    expect(() => str({})).toThrowErrorMatchingInlineSnapshot(
      '"Expected string, received an object"'
    );
    // @ts-expect-error ---
    expect(() => str([])).toThrowErrorMatchingInlineSnapshot(
      '"Expected string, received an Array"'
    );
  });
  it("number", () => {
    const num = validate.number();

    expect(num(999)).toEqual(999);

    // @ts-expect-error ---
    expect(() => num("123")).toThrowErrorMatchingInlineSnapshot(
      '"Expected number, received \\"123\\""'
    );
    // @ts-expect-error ---
    expect(() => num([])).toThrowErrorMatchingInlineSnapshot(
      '"Expected number, received an Array"'
    );
    // @ts-expect-error ---
    expect(() => num({})).toThrowErrorMatchingInlineSnapshot(
      '"Expected number, received an object"'
    );
  });

  describe("object", () => {
    type ExpectedType = {
      foo: "FOO";
    };

    const objParser = validate.object<ExpectedType>();

    it("should have the correct type", () => {
      expectType<
        InferParserInput<typeof objParser>
      >().toStrictEqual<ExpectedType>();
      expectType<
        InferParserOutput<typeof objParser>
      >().toStrictEqual<ExpectedType>();

      const opt = objParser.optional();
      expectType<InferParserInput<typeof opt>>().toStrictEqual<
        ExpectedType | undefined | null
      >();
      expectType<InferParserOutput<typeof opt>>().toStrictEqual<
        ExpectedType | undefined | null
      >();
    });

    it("should successfully pass valid input", () => {
      const valid: ExpectedType = { foo: "FOO" };
      expect(objParser(valid)).toEqual(valid);
      expect(objParser(valid)).toBe(valid);
    });

    it("should pass-through any object", () => {
      const invalidObject = { INVALID: true };
      expect(
        // @ts-expect-error ---
        objParser(invalidObject)
      ).toEqual(invalidObject);
    });

    it("should throw errors for non-objects", () => {
      expect(
        // @ts-expect-error ---
        improveErrorMessage(() => objParser(null))
      ).toThrowErrorMatchingInlineSnapshot(
        '"Expected an object, received null"'
      );
      expect(
        // @ts-expect-error ---
        improveErrorMessage(() => objParser(123))
      ).toThrowErrorMatchingInlineSnapshot(
        '"Expected an object, received 123"'
      );
      expect(
        // @ts-expect-error ---
        improveErrorMessage(() => objParser("string"))
      ).toThrowErrorMatchingInlineSnapshot(
        '"Expected an object, received \\"string\\""'
      );
    });
  });

  describe("array", () => {
    const arrParser = validate.array<number[]>();

    it("should ensure the input was an array", () => {
      expect(
        // @ts-expect-error ---
        improveErrorMessage(() => arrParser({}))
      ).toThrowErrorMatchingInlineSnapshot(
        '"Expected an array, received an object"'
      );
      expect(
        // @ts-expect-error ---
        improveErrorMessage(() => arrParser(null))
      ).toThrowErrorMatchingInlineSnapshot(
        '"Expected an array, received null"'
      );
    });

    it("returns valid input", () => {
      const numbers = [1, 2, 3];

      expect(arrParser(numbers)).toEqual(numbers);
    });

    it("does not check invalid items", () => {
      const invalid = [1, "2", "3"];
      expect(
        arrParser(
          // @ts-expect-error ---
          invalid
        )
      ).toEqual(invalid);
    });
  });
});

export function improveErrorMessage(cb: () => void) {
  return () => {
    try {
      cb();
    } catch (err) {
      if (err instanceof ValidationErrors) {
        throw err.withMessage();
      }
      throw err;
    }
  };
}
