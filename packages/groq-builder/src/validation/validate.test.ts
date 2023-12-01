import { describe, expect, it } from "vitest";
import { validate } from "./validate";
import { expectType } from "../tests/expectType";

describe("validate", () => {
  it("string", () => {
    const str = validate.string();

    expect(str("TEST")).toEqual("TEST");
    const validResult = str("TEST");
    expectType<typeof validResult>().toStrictEqual<string>();

    // @ts-expect-error ---
    expect(() => str(undefined)).toThrowErrorMatchingInlineSnapshot(
      '"Expected a string, but got undefined"'
    );
    // @ts-expect-error ---
    expect(() => str(null)).toThrowErrorMatchingInlineSnapshot(
      '"Expected a string, but got null"'
    );
    // @ts-expect-error ---
    expect(() => str(123)).toThrowErrorMatchingInlineSnapshot(
      '"Expected a string, but got 123"'
    );
    // @ts-expect-error ---
    expect(() => str({})).toThrowErrorMatchingInlineSnapshot(
      '"Expected a string, but got an object"'
    );
    // @ts-expect-error ---
    expect(() => str([])).toThrowErrorMatchingInlineSnapshot(
      '"Expected a string, but got an Array"'
    );
  });
  it("string.optional", () => {
    const str = validate.string().optional();

    expect(str("TEST")).toEqual("TEST");
    expect(str(undefined)).toEqual(undefined);
    expect(str(null)).toEqual(null);

    // @ts-expect-error ---
    expect(() => str(123)).toThrowErrorMatchingInlineSnapshot(
      '"Expected a string, but got 123"'
    );
    // @ts-expect-error ---
    expect(() => str({})).toThrowErrorMatchingInlineSnapshot(
      '"Expected a string, but got an object"'
    );
    // @ts-expect-error ---
    expect(() => str([])).toThrowErrorMatchingInlineSnapshot(
      '"Expected a string, but got an Array"'
    );
  });
  it("number", () => {
    const num = validate.number();

    expect(num(999)).toEqual(999);

    // @ts-expect-error ---
    expect(() => num("123")).toThrowErrorMatchingInlineSnapshot(
      '"Expected a number, but got \\"123\\""'
    );
    // @ts-expect-error ---
    expect(() => num([])).toThrowErrorMatchingInlineSnapshot(
      '"Expected a number, but got an Array"'
    );
    // @ts-expect-error ---
    expect(() => num({})).toThrowErrorMatchingInlineSnapshot(
      '"Expected a number, but got an object"'
    );
  });
});
