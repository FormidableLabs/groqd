import { describe, it } from "vitest";
import { createGroqBuilder } from "./groq-builder";
import { SchemaConfig } from "./tests/schemas/nextjs-sanity-fe";
import { expectType } from "./tests/expectType";
import { ExtractScope } from "./utils/common-types";

const q = createGroqBuilder<SchemaConfig>();

describe("", () => {
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
