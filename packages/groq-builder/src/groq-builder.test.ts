import { describe, expect, it } from "vitest";
import { SchemaConfig } from "./tests/schemas/nextjs-sanity-fe";
import { expectType } from "./tests/expectType";
import { InferResultType } from "./types/public-types";
import { createGroqBuilder } from "./index";

const q = createGroqBuilder<SchemaConfig>({ indent: "  " });

describe("GroqBuilder", () => {
  it("should have a 'never' result", () => {
    expectType<InferResultType<typeof q>>().toStrictEqual<never>();
  });
  it("should have an empty query", () => {
    expect(q).toMatchObject({
      query: "",
    });
  });
  describe("getProductBySlug", () => {
    const getProductBySlug = q.star
      .filterByType("product")
      .any("[slug.current == $slug]")
      .projection((q) => ({
        _id: true,
        name: true,
        categories: q.projection("categories[]").deref().projection({
          name: true,
        }),
        slug: q.projection("slug").projection("current"),
        variants: q
          .projection("variants[]")
          .deref()
          .projection((q) => ({
            _id: true,
            name: true,
            msrp: true,
            price: true,
            slug: q.projection("slug").projection("current"),
            style: q.projection("style[]").deref().projection({
              _id: true,
              name: true,
            }),
          })),
      }));

    it("should have correct types", () => {
      expectType<InferResultType<typeof getProductBySlug>>().toStrictEqual<
        Array<{
          _id: string;
          name: string;
          categories: Array<{
            name: string;
          }>;
          slug: string;
          variants: Array<{
            _id: string;
            name: string;
            msrp: number;
            price: number;
            slug: string;
            style: Array<{
              _id: string;
              name: string | undefined;
            }>;
          }>;
        }>
      >();
    });

    it("the query should look correct", () => {
      expect(getProductBySlug.query).toMatchInlineSnapshot(
        `
        "*[_type == \\"product\\"][slug.current == $slug] {
            _id,
            name,
            \\"categories\\": categories[]-> {
              name
            },
            \\"slug\\": slug.current,
            \\"variants\\": variants[]-> {
              _id,
              name,
              msrp,
              price,
              \\"slug\\": slug.current,
              \\"style\\": style[]-> {
                _id,
                name
              }
            }
          }"
      `
      );
    });
  });
});
