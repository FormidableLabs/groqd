import { describe, expect, expectTypeOf, it } from "vitest";
import { validation } from "./index";
import { InferParserInput, InferParserOutput } from "../../types/public-types";
import { ValidationErrors } from "../validation-errors";

describe("primitiveValidation", () => {
  it("string", () => {
    const str = validation.string();

    expect(str("TEST")).toEqual("TEST");
    const validResult = str("TEST");
    expectTypeOf<typeof validResult>().toEqualTypeOf<string>();

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
      '"Expected string, received an array"'
    );
  });
  it("string.optional", () => {
    const str = validation.string().optional();

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
      '"Expected string, received an array"'
    );
  });
  it("number", () => {
    const num = validation.number();

    expect(num(999)).toEqual(999);

    // @ts-expect-error ---
    expect(() => num("123")).toThrowErrorMatchingInlineSnapshot(
      '"Expected number, received \\"123\\""'
    );
    // @ts-expect-error ---
    expect(() => num([])).toThrowErrorMatchingInlineSnapshot(
      '"Expected number, received an array"'
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

    const objParser = validation.object<ExpectedType>();

    it("should have the correct type", () => {
      expectTypeOf<
        InferParserInput<typeof objParser>
      >().toEqualTypeOf<ExpectedType>();
      expectTypeOf<
        InferParserOutput<typeof objParser>
      >().toEqualTypeOf<ExpectedType>();

      const opt = objParser.optional();
      expectTypeOf<InferParserInput<typeof opt>>().toEqualTypeOf<
        ExpectedType | undefined | null
      >();
      expectTypeOf<InferParserOutput<typeof opt>>().toEqualTypeOf<
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
    const arrParser = validation.array<number>();

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
