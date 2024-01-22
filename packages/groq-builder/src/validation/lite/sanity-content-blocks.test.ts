import { describe, expect, it } from "vitest";
import { validation } from "./index";
import { mock } from "../../tests/mocks/nextjs-sanity-fe-mocks";

describe("contentBlock", () => {
  const parseBlock = validation.contentBlock();

  const contentBlock = mock.contentBlock({
    children: [{ _type: "span", _key: "", text: "lorem ipsum" }],
  });

  it("should parse correctly", () => {
    expect(parseBlock(contentBlock)).toEqual(contentBlock);
  });

  it("should not deep-check the data", () => {
    const invalid = {
      invalid: true,
    };
    expect(
      parseBlock(
        // @ts-expect-error ---
        invalid
      )
    ).toEqual(invalid);
  });

  it("should fail for non-object data", () => {
    expect(() =>
      parseBlock(
        // @ts-expect-error ---
        "invalid"
      )
    ).toThrowErrorMatchingInlineSnapshot(
      '"Expected an object, received \\"invalid\\""'
    );
    expect(() =>
      parseBlock(
        // @ts-expect-error ---
        null
      )
    ).toThrowErrorMatchingInlineSnapshot('"Expected an object, received null"');
    expect(() =>
      parseBlock(
        // @ts-expect-error ---
        123
      )
    ).toThrowErrorMatchingInlineSnapshot('"Expected an object, received 123"');
  });
});

describe("contentBlocks", () => {
  const parseBlocks = validation.contentBlocks();
  const contentBlocks = mock.array(5, () => mock.contentBlock({}));
  it("should work with valid data", () => {
    expect(parseBlocks(contentBlocks)).toEqual(contentBlocks);
  });

  it("should not deep-check items in the array", () => {
    const invalidData = [{ invalid: true }, "INVALID"];
    expect(
      parseBlocks(
        // @ts-expect-error ---
        invalidData
      )
    ).toEqual(invalidData);
  });
  it("should fail for non-arrays", () => {
    expect(() =>
      parseBlocks(
        // @ts-expect-error ---
        null
      )
    ).toThrowErrorMatchingInlineSnapshot('"Expected an array, received null"');
    expect(() =>
      parseBlocks(
        // @ts-expect-error ---
        123
      )
    ).toThrowErrorMatchingInlineSnapshot('"Expected an array, received 123"');
    expect(() =>
      parseBlocks(
        // @ts-expect-error ---
        "invalid"
      )
    ).toThrowErrorMatchingInlineSnapshot(
      '"Expected an array, received \\"invalid\\""'
    );
  });
});
