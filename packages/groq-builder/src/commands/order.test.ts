import { describe, it, expect } from "vitest";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { ExtractScope } from "../utils/common-types";
import { createGroqBuilder } from "../index";

const q = createGroqBuilder<SchemaConfig>();
const variants = q.star.filterByType("variant");
type Variant = SanitySchema["variant"];

describe("order", () => {
  it("invalid types are caught", () => {
    // @ts-expect-error ---
    variants.order("INVALID");
    // @ts-expect-error ---
    variants.order("price FOO");
    // @ts-expect-error ---
    variants.order("INVALID desc");
  });
  it("result type is not changed", () => {
    expectType<ExtractScope<typeof variants>>().toStrictEqual<Array<Variant>>();
    const res = variants.order("price");
    expectType<ExtractScope<typeof res>>().toStrictEqual<Array<Variant>>();
  });
  it("query is compiled correctly", () => {
    const res = variants.order("price");

    expect(res).toMatchObject({
      query: `*[_type == "variant"] | order(price)`,
    });
  });
  it("asc", () => {
    const res = variants.order("price asc");

    expect(res).toMatchObject({
      query: `*[_type == "variant"] | order(price asc)`,
    });
  });
  it("desc", () => {
    const res = variants.order("price desc");

    expect(res).toMatchObject({
      query: `*[_type == "variant"] | order(price desc)`,
    });
  });

  describe("can sort by multiple fields", () => {
    it("invalid types are caught", () => {
      variants.order(
        //
        "price",
        // @ts-expect-error ---
        "INVALID"
      );
      variants.order(
        //
        "price",
        "msrp",
        // @ts-expect-error ---
        "INVALID"
      );
      variants.order(
        // @ts-expect-error ---
        "price INVALID",
        "msrp"
      );
    });
    it("query is built correctly", () => {
      const res = variants.order("price", "msrp", "name");

      expect(res).toMatchObject({
        query: `*[_type == "variant"] | order(price, msrp, name)`,
      });
    });
    it("asc / desc", () => {
      const res = variants.order("price asc", "msrp desc", "name asc");

      expect(res).toMatchObject({
        query: `*[_type == "variant"] | order(price asc, msrp desc, name asc)`,
      });
    });
  });
});
