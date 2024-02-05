import { describe, expect, expectTypeOf, it } from "vitest";
import { SchemaConfig } from "./tests/schemas/nextjs-sanity-fe";
import { InferResultType } from "./types/public-types";
import { Empty } from "./types/utils";
import { createGroqBuilder } from "./createGroqBuilder";

const q = createGroqBuilder<SchemaConfig>({ indent: "  " });

describe("GroqBuilder", () => {
  it("root should have an Empty result", () => {
    expectTypeOf<InferResultType<typeof q>>().toEqualTypeOf<Empty>();
  });
  it("should have an empty query", () => {
    expect(q).toMatchObject({
      query: "",
    });
  });
  describe("getProductBySlug", () => {
    const getProductBySlug = q.star
      .filterByType("product")
      .filter("slug.current == $slug")
      .grab((q) => ({
        _id: true,
        name: true,
        categories: q.field("categories[]").deref().grab({
          name: true,
        }),
        slug: q.field("slug").field("current"),
        variants: q
          .field("variants[]")
          .deref()
          .grab((q) => ({
            _id: true,
            name: true,
            msrp: true,
            price: true,
            slug: q.field("slug").field("current"),
            style: q.field("style[]").deref().grab({
              _id: true,
              name: true,
            }),
          })),
      }));

    it("should have correct types", () => {
      expectTypeOf<InferResultType<typeof getProductBySlug>>().toEqualTypeOf<
        Array<{
          _id: string;
          name: string;
          categories: null | Array<{
            name: string;
          }>;
          slug: string;
          variants: null | Array<{
            _id: string;
            name: string;
            msrp: number;
            price: number;
            slug: string;
            style: null | Array<{
              _id: string;
              name: string | null;
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
