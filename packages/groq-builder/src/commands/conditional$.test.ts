import { describe, expect, it } from "vitest";
import { createGroqBuilder, InferResultType } from "../index";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { ExtractConditionalProjectionTypes } from "./conditional-types";
import { expectType } from "../tests/expectType";

const q = createGroqBuilder<SchemaConfig>({ indent: "  " });
const qBase = q.star.filterByType("variant");

describe("conditional$", () => {
  it("by itself, we should be able to extract the union of projection types", () => {
    const qConditional = q.star.filterByType("variant").conditional$({
      '_type == "foo"': {
        name: true,
        price: true,
      },
      '_type == "bar"': {
        name: true,
        msrp: true,
      },
    });

    expectType<
      ExtractConditionalProjectionTypes<typeof qConditional>
    >().toStrictEqual<
      { name: string; price: number } | { name: string; msrp: number }
    >();
  });

  const qAll = qBase.project(
    {
      name: true,
    },
    (qA) =>
      qA.conditional$({
        "price == msrp": {
          onSale: q.value(false),
        },
        "price < msrp": {
          onSale: q.value(true),
          price: true,
          msrp: true,
        },
      })
  );

  it("should be able to extract the return type", () => {
    expectType<InferResultType<typeof qAll>>().toStrictEqual<
      Array<
        | { name: string; onSale: false }
        | { name: string; onSale: true; price: number; msrp: number }
      >
    >();
  });

  it("the query should look correct", () => {
    expect(qAll.query).toMatchInlineSnapshot(
      `
      "*[_type == \\"variant\\"] {
          name,
          price == msrp =>  {
              \\"onSale\\": false
            },
          price < msrp =>  {
              \\"onSale\\": true,
              price,
              msrp
            }
        }"
    `
    );
  });
});
