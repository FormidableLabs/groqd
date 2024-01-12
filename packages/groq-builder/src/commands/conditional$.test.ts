import { describe, expect, it } from "vitest";
import { createGroqBuilder, GroqBuilder, InferResultType } from "../index";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { ExtractConditionalProjectionTypes } from "./conditional-types";
import { expectType } from "../tests/expectType";
import { Simplify } from "../types/utils";

const q = createGroqBuilder<SchemaConfig>({ indent: "  " });
const qBase = q.star.filterByType("variant");

describe("conditional$", () => {
  describe("by itself", () => {
    const conditionalResult = q.star.filterByType("variant").conditional$({
      "price == msrp": {
        onSale: q.value(false),
      },
      "price < msrp": {
        onSale: q.value(true),
        price: true,
        msrp: true,
      },
    });
    it("we should be able to extract the intersection of projection types", () => {
      expectType<
        Simplify<ExtractConditionalProjectionTypes<typeof conditionalResult>>
      >().toStrictEqual<
        {} | { onSale: false } | { onSale: true; price: number; msrp: number }
      >();
    });
    it("should return a spreadable object", () => {
      expect(conditionalResult).toMatchObject({
        "[Conditional] [$]": expect.any(GroqBuilder),
      });
    });
  });

  const qAll = qBase.project((qA) => ({
    name: true,
    ...qA.conditional$({
      "price == msrp": {
        onSale: q.value(false),
      },
      "price < msrp": {
        onSale: q.value(true),
        price: true,
        msrp: true,
      },
    }),
  }));

  it("should be able to extract the return type", () => {
    expectType<InferResultType<typeof qAll>>().toStrictEqual<
      Array<
        | { name: string }
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
          price == msrp => {
              \\"onSale\\": false
            },
          price < msrp => {
              \\"onSale\\": true,
              price,
              msrp
            }
        }"
    `
    );
  });
});
