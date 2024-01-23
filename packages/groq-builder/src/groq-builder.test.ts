import { describe, expect, it } from "vitest";
import { SchemaConfig } from "./tests/schemas/nextjs-sanity-fe";
import { expectType } from "./tests/expectType";
import { InferResultType } from "./types/public-types";
import { createGroqBuilder } from "./index";
import { Empty } from "./types/utils";

const q = createGroqBuilder<SchemaConfig>({ indent: "  " });

describe("GroqBuilder", () => {
  it("root should have an Empty result", () => {
    expectType<InferResultType<typeof q>>().toStrictEqual<Empty>();
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
        _id: q.infer(),
        name: q.infer(),
        categories: q.field("categories[]").deref().grab({
          name: q.infer(),
        }),
        slug: q.field("slug").field("current"),
        variants: q
          .field("variants[]")
          .deref()
          .grab((q) => ({
            _id: q.infer(),
            name: q.infer(),
            msrp: q.infer(),
            price: q.infer(),
            slug: q.field("slug").field("current"),
            style: q.field("style[]").deref().grab({
              _id: q.infer(),
              name: q.infer(),
            }),
          })),
      }));

    it("should have correct types", () => {
      expectType<InferResultType<typeof getProductBySlug>>().toStrictEqual<
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
