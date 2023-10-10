import { createGroqBuilder } from "./groq-builder";
import { SchemaConfig } from "../sanity-types";
import { expectType } from "./tests/expectType";
import { ExtractScope } from "./utils/common-types";

const q = createGroqBuilder<SchemaConfig>();

describe("", () => {
  it("getProductBySlug", () => {
    const getProductBySlug = q.star
      .filterByType("product")
      .filter("slug.current == $slug")
      .grab((q) => ({
        _id: true,
        name: true,
        categories: q.grabOne("categories").filter().deref().grab({
          name: true,
        }),
        slug: q.slug("slug"),
        variants: q
          .grabOne("variants")
          .filter()
          .deref()
          .grab((q) => ({
            _id: true,
            name: true,
            msrp: true,
            price: true,
            slug: q.slug("slug"),
            style: q.grabOne("style").filter().deref().grab({
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
