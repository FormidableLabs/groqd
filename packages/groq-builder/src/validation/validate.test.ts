import { describe, expect, it } from "vitest";
import { validate } from "./validate";
import { expectType } from "../tests/expectType";
import { InferParserInput, InferParserOutput } from "../types/public-types";
import { ValidationErrors } from "./validation-errors";

describe("validate", () => {
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
    const objParser = validate.object({
      str: validate.string(),
      strOpt: validate.string().optional(),
      num: validate.number(),
      nested: validate.object({
        bool: validate.boolean(),
      }),
    });

    type Expected = {
      str: string;
      strOpt: string | null | undefined;
      num: number;
      nested: {
        bool: boolean;
      };
    };

    it("should have the correct type", () => {
      expectType<
        InferParserInput<typeof objParser>
      >().toStrictEqual<Expected>();
      expectType<
        InferParserOutput<typeof objParser>
      >().toStrictEqual<Expected>();

      const opt = objParser.optional();
      expectType<InferParserInput<typeof opt>>().toStrictEqual<
        Expected | undefined | null
      >();
      expectType<InferParserOutput<typeof opt>>().toStrictEqual<
        Expected | undefined | null
      >();
    });

    it("should successfully pass valid input", () => {
      const valid: Expected = {
        str: "string",
        strOpt: null,
        num: 5,
        nested: { bool: true },
      };
      expect(objParser(valid)).toEqual(valid);
      expect(objParser(valid)).not.toBe(valid);
    });

    it("should throw errors for invalid data", () => {
      const invalid = {
        str: null,
        strOpt: 999,
        num: "hey",
        nested: { foo: true },
      };

      expect(
        // @ts-expect-error ---
        improveErrorMessage(() => objParser(invalid))
      ).toThrowErrorMatchingInlineSnapshot(`
        "4 Parsing Errors:
        result.str: Expected string, received null
        result.strOpt: Expected string, received 999
        result.num: Expected number, received \\"hey\\"
        result.nested.bool: Expected boolean, received undefined"
      `);

      expect(
        // @ts-expect-error ---
        improveErrorMessage(() => objParser(123))
      ).toThrowErrorMatchingInlineSnapshot(
        '"Expected an object, received 123"'
      );
    });

    describe("with different inputs and outputs", () => {
      const mapper = validate.object({
        stringToNumber: (input: string) => Number(input),
        numberToString: (input: number) => String(input),
        stringToLiteral: (input: string) => input as "LITERAL",
      });
      type ExpectedInput = {
        stringToNumber: string;
        numberToString: number;
        stringToLiteral: string;
      };
      type ExpectedOutput = {
        stringToNumber: number;
        numberToString: string;
        stringToLiteral: "LITERAL";
      };

      it("types should be correct", () => {
        expectType<
          InferParserInput<typeof mapper>
        >().toStrictEqual<ExpectedInput>();
        expectType<
          InferParserOutput<typeof mapper>
        >().toStrictEqual<ExpectedOutput>();
      });

      it("should map data correctly", () => {
        expect(
          mapper({
            stringToNumber: "123",
            numberToString: 456,
            stringToLiteral: "FOO",
          })
        ).toEqual({
          stringToNumber: 123,
          numberToString: "456",
          stringToLiteral: "FOO",
        });
      });
    });
  });

  describe("array", () => {
    const arrParser = validate.array(validate.number());

    it("should ensure the input was an array", () => {
      expect(
        // @ts-expect-error ---
        improveErrorMessage(() => arrParser({}))
      ).toThrowErrorMatchingInlineSnapshot(
        '"Expected array, received an object"'
      );
      expect(
        // @ts-expect-error ---
        improveErrorMessage(() => arrParser(null))
      ).toThrowErrorMatchingInlineSnapshot('"Expected array, received null"');
    });

    it("should ensure all items are valid", () => {
      const numbers = [1, 2, 3];
      expect(arrParser(numbers)).toEqual(numbers);
      expect(arrParser(numbers)).not.toBe(numbers);
    });

    it("should fail for invalid items", () => {
      const invalid = [1, "2", "3"];
      expect(
        // @ts-expect-error ---
        improveErrorMessage(() => arrParser(invalid))
      ).toThrowErrorMatchingInlineSnapshot(`
        "2 Parsing Errors:
        result[1]: Expected number, received \\"2\\"
        result[2]: Expected number, received \\"3\\""
      `);
    });
  });
});

function improveErrorMessage(cb: () => void) {
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
