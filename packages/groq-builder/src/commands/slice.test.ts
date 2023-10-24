import { describe, it, expect } from "vitest";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { ExtractScope } from "../utils/common-types";
import { createGroqBuilder } from "../index";

const q = createGroqBuilder<SchemaConfig>();

type Variant = SanitySchema["variant"];

describe("slice", () => {
  const variants = q.star.filterByType("variant");

  describe("a single item", () => {
    const result = variants.slice(0);
    it("should be typed correctly", () => {
      expectType<ExtractScope<typeof result>>().toStrictEqual<Variant>();
    });
    it("query should be correct", () => {
      expect(result).toMatchObject({
        query: '*[_type == "variant"][0]',
      });
    });
  });
  describe("a range", () => {
    it("invalid types should be caught", () => {
      // @ts-expect-error ---
      variants.slice("5.....10");
      // @ts-expect-error ---
      variants.slice("5.10");
      // @ts-expect-error ---
      variants.slice("510");
    });
    it("query should be correct", () => {
      const result = variants.slice("5..10");
      expect(result.query).toMatchInlineSnapshot(
        '"*[_type == \\"variant\\"][5..10]"'
      );
    });
    it("query should be correct", () => {
      const result = variants.slice("5...10");
      expect(result.query).toMatchInlineSnapshot(
        '"*[_type == \\"variant\\"][5...10]"'
      );
    });
  });
});
