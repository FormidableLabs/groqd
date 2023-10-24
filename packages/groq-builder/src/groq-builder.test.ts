import { describe, expect, it } from "vitest";
import { SchemaConfig } from "./tests/schemas/nextjs-sanity-fe";
import { expectType } from "./tests/expectType";
import { ExtractScope } from "./utils/common-types";
import { createGroqBuilder } from "./index";

const q = createGroqBuilder<SchemaConfig>();

describe("GroqBuilder", () => {
  it("should have a 'never' result", () => {
    expectType<ExtractScope<typeof q>>().toStrictEqual<never>();
  });
  it("should have an empty query", () => {
    expect(q).toMatchObject({
      query: "",
    });
  });
  it("getProductBySlug", () => {
    const getProductBySlug = q.star
      .filterByType("product")
      .any("[slug.current == $slug]")
      .projection((q) => ({
        _id: true,
        name: true,
        categories: q.projection("categories[]").deref().projection({
          name: true,
        }),
        slug: q.slug("slug"),
        variants: q
          .projection("variants[]")
          .deref()
          .projection((q) => ({
            _id: true,
            name: true,
            msrp: true,
            price: true,
            slug: q.slug("slug"),
            style: q.projection("style[]").deref().projection({
              _id: true,
              name: true,
            }),
          })),
      }));

    expectType<ExtractScope<typeof getProductBySlug>>().toStrictEqual<
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
});
