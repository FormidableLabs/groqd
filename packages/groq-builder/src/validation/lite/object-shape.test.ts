import { describe, expect, expectTypeOf, it } from "vitest";
import { validation } from "./index";
import { InferParserInput, InferParserOutput } from "../../types/public-types";
import { objectValidation } from "./object-shape";
import { improveErrorMessage } from "./primitives.test";

describe("objectValidation.object", () => {
  const objParser = objectValidation.object({
    str: validation.string(),
    strOpt: validation.string().optional(),
    num: validation.number(),
    nested: objectValidation.object({
      bool: validation.boolean(),
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
    expectTypeOf<
      InferParserInput<typeof objParser>
    >().toEqualTypeOf<Expected>();
    expectTypeOf<
      InferParserOutput<typeof objParser>
    >().toEqualTypeOf<Expected>();

    const opt = objParser.optional();
    expectTypeOf<InferParserInput<typeof opt>>().toEqualTypeOf<
      Expected | undefined | null
    >();
    expectTypeOf<InferParserOutput<typeof opt>>().toEqualTypeOf<
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
      improveErrorMessage(() =>
        objParser(
          // @ts-expect-error ---
          invalid
        )
      )
    ).toThrowErrorMatchingInlineSnapshot(`
        "4 Parsing Errors:
        result.str: Expected string, received null
        result.strOpt: Expected string, received 999
        result.num: Expected number, received \\"hey\\"
        result.nested.bool: Expected boolean, received undefined"
      `);

    expect(
      improveErrorMessage(() =>
        objParser(
          // @ts-expect-error ---
          123
        )
      )
    ).toThrowErrorMatchingInlineSnapshot('"Expected an object, received 123"');
  });

  describe("with different inputs and outputs", () => {
    const mapper = objectValidation.object({
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
      expectTypeOf<
        InferParserInput<typeof mapper>
      >().toEqualTypeOf<ExpectedInput>();
      expectTypeOf<
        InferParserOutput<typeof mapper>
      >().toEqualTypeOf<ExpectedOutput>();
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
