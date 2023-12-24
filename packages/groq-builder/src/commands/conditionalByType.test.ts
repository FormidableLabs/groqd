import { describe, it, expect } from "vitest";
import { createGroqBuilder, InferResultType } from "../index";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { ExtractConditionalProjectionTypes } from "./conditional-types";
import { expectType } from "../tests/expectType";

const q = createGroqBuilder<SchemaConfig>();

describe("conditionalByType", () => {
  const qConditionalByType = q.star.conditionalByType({
    variant: {
      _type: true,
      name: true,
      price: true,
    },
    style: {
      _type: true,
      name: true,
      slug: "slug.current",
    },
    category: (qC) => ({
      _type: true,
      name: true,
      slug: qC.field("slug.current"),
    }),
  });

  it("we should be able to extract the return types", () => {
    type ConditionalResults = ExtractConditionalProjectionTypes<
      typeof qConditionalByType
    >;

    expectType<ConditionalResults>().toStrictEqual<
      | { _type: "variant"; name: string; price: number }
      | { _type: "style"; name: string | undefined; slug: string }
      | { _type: "category"; name: string; slug: string }
    >();
  });

  it("a projection should return the correct types", () => {
    const qAll = q.star.project({
      _type: true,
      ...q.conditionalByType({
        style: { name: true, color: true },
        variant: { name: true, price: true },
      }),
    });

    type QueryResult = InferResultType<typeof qAll>;

    expectType<QueryResult>().toStrictEqual<>();
  });
});
