import { describe, expect, it } from "vitest";
import { validation } from "./index";
import { arrayValidation } from "./array-shape";
import { improveErrorMessage } from "./primitives.test";

describe("array", () => {
  const arrParser = arrayValidation.array(validation.number());

  it("should ensure the input was an array", () => {
    expect(
      improveErrorMessage(() =>
        arrParser(
          // @ts-expect-error ---
          {}
        )
      )
    ).toThrowErrorMatchingInlineSnapshot(
      '"Expected an array, received an object"'
    );
    expect(
      improveErrorMessage(() =>
        arrParser(
          // @ts-expect-error ---
          null
        )
      )
    ).toThrowErrorMatchingInlineSnapshot('"Expected an array, received null"');
  });

  it("should ensure all items are valid", () => {
    const numbers = [1, 2, 3];
    expect(arrParser(numbers)).toEqual(numbers);
    expect(arrParser(numbers)).not.toBe(numbers);
  });

  it("should fail for invalid items", () => {
    const invalid = [1, "2", "3"];
    expect(
      improveErrorMessage(() =>
        arrParser(
          // @ts-expect-error ---
          invalid
        )
      )
    ).toThrowErrorMatchingInlineSnapshot(`
        "2 Parsing Errors:
        result[1]: Expected number, received \\"2\\"
        result[2]: Expected number, received \\"3\\""
      `);
  });
});
