import { describe, it, expect } from "vitest";
import { SanitySchema, SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { ExtractScope } from "../utils/common-types";
import { createGroqBuilder } from "../index";
import { executeBuilder } from "../tests/mocks/executeQuery";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";

const q = createGroqBuilder<SchemaConfig>();
const qVariants = q.star.filterByType("variant");

describe("order", () => {
  const data = mock.generateSeedData();
  it("invalid types are caught", () => {
    // @ts-expect-error ---
    qVariants.order("INVALID");
    // @ts-expect-error ---
    qVariants.order("price FOO");
    // @ts-expect-error ---
    qVariants.order("INVALID desc");
  });
  const qOrder = qVariants.order("price");
  it("result type is not changed", () => {
    expectType<ExtractScope<typeof qVariants>>().toStrictEqual<
      Array<SanitySchema.Variant>
    >();

    expectType<ExtractScope<typeof qOrder>>().toStrictEqual<
      Array<SanitySchema.Variant>
    >();
  });
  it("query is compiled correctly", () => {
    expect(qOrder).toMatchObject({
      query: `*[_type == "variant"] | order(price)`,
    });
  });
  it("should execute correctly", async () => {
    const results = await executeBuilder(data.datalake, qOrder);
    expect(results).toMatchObject([
      //
    ]);
  });

  it("asc", () => {
    const qOrder = qVariants.order("price asc");

    expect(qOrder).toMatchObject({
      query: `*[_type == "variant"] | order(price asc)`,
    });
  });
  it("desc", () => {
    const qOrder = qVariants.order("price desc");

    expect(qOrder).toMatchObject({
      query: `*[_type == "variant"] | order(price desc)`,
    });
  });

  describe("can sort by multiple fields", () => {
    it("invalid types are caught", () => {
      qVariants.order(
        //
        "price",
        // @ts-expect-error ---
        "INVALID"
      );
      qVariants.order(
        //
        "price",
        "msrp",
        // @ts-expect-error ---
        "INVALID"
      );
      qVariants.order(
        // @ts-expect-error ---
        "price INVALID",
        "msrp"
      );
    });
    it("query is built correctly", () => {
      const qOrder = qVariants.order("price", "msrp", "name");

      expect(qOrder).toMatchObject({
        query: `*[_type == "variant"] | order(price, msrp, name)`,
      });
    });
    it("asc / desc", () => {
      const qOrder = qVariants.order("price asc", "msrp desc", "name asc");

      expect(qOrder).toMatchObject({
        query: `*[_type == "variant"] | order(price asc, msrp desc, name asc)`,
      });
    });
  });
});
