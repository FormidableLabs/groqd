import { describe, expect, it } from "vitest";
import {
  createGroqBuilder,
  GroqBuilder,
  InferResultItem,
  InferResultType,
} from "../index";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { ExtractConditionalProjectionTypes } from "./conditional-types";
import { expectType } from "../tests/expectType";
import { Empty, Simplify } from "../types/utils";

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
        price: q.infer(),
        msrp: q.infer(),
      },
    });

    it("we should be able to extract the intersection of projection types", () => {
      expectType<
        Simplify<ExtractConditionalProjectionTypes<typeof conditionalResult>>
      >().toStrictEqual<
        | Empty
        | { onSale: false }
        | { onSale: true; price: number; msrp: number }
      >();
    });
    it("should return a spreadable object", () => {
      expect(conditionalResult).toMatchObject({
        "[Conditional] [$]": expect.any(GroqBuilder),
      });
    });
  });

  const qAll = qBase.project((qA) => ({
    name: q.infer(),
    ...qA.conditional$({
      "price == msrp": {
        onSale: q.value(false),
      },
      "price < msrp": {
        onSale: q.value(true),
        price: q.infer(),
        msrp: q.infer(),
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

  describe("multiple conditionals", () => {
    describe("without using unique keys", () => {
      const qIncorrect = q.star.filterByType("variant").project((qV) => ({
        name: q.infer(),
        ...qV.conditional$({
          "price == msrp": {
            onSale: q.value(false),
          },
          "price < msrp": {
            onSale: q.value(true),
            price: q.infer(),
            msrp: q.infer(),
          },
        }),
        // Here we're trying to spread another conditional,
        // however, it will override the first one
        // since we didn't specify a unique key:
        ...qV.conditional$({
          "second == condition": { price: q.infer() },
        }),
      }));

      it("the type will be missing the first conditionals", () => {
        expectType<InferResultType<typeof qIncorrect>>().toStrictEqual<
          Array<{ name: string } | { name: string; price: number }>
        >();
      });
      it("the query will also be missing the first conditionals", () => {
        expect(qIncorrect.query).toMatchInlineSnapshot(`
          "*[_type == \\"variant\\"] {
              name,
              second == condition => {
                  price
                }
            }"
        `);
      });
    });

    describe("with different keys", () => {
      const qMultipleConditions = q.star
        .filterByType("variant")
        .project((qV) => ({
          name: q.infer(),
          ...qV.conditional$({
            "price == msrp": {
              onSale: q.value(false),
            },
            "price < msrp": {
              onSale: q.value(true),
              price: q.infer(),
              msrp: q.infer(),
            },
          }),
          ...qV.conditional$(
            {
              "another == condition1": { foo: q.value("FOO") },
              "another == condition2": { bar: q.value("BAR") },
            },
            { key: "unique-key" }
          ),
        }));

      it("the types should be inferred correctly", () => {
        type ActualItem = InferResultItem<typeof qMultipleConditions>;
        type ExpectedItem =
          | { name: string }
          | { name: string; onSale: false }
          | { name: string; onSale: true; price: number; msrp: number }
          | { name: string; foo: "FOO" }
          | { name: string; onSale: false; foo: "FOO" }
          | {
              name: string;
              onSale: true;
              price: number;
              msrp: number;
              foo: "FOO";
            }
          | { name: string; bar: "BAR" }
          | { name: string; onSale: false; bar: "BAR" }
          | {
              name: string;
              onSale: true;
              price: number;
              msrp: number;
              bar: "BAR";
            };

        type Remainder = Exclude<ActualItem, ExpectedItem>;
        expectType<Remainder>().toStrictEqual<never>();
        expectType<ActualItem>().toStrictEqual<ExpectedItem>();
      });

      it("the query should be compiled correctly", () => {
        expect(qMultipleConditions.query).toMatchInlineSnapshot(`
          "*[_type == \\"variant\\"] {
              name,
              price == msrp => {
                  \\"onSale\\": false
                },
              price < msrp => {
                  \\"onSale\\": true,
                  price,
                  msrp
                },
              another == condition1 => {
                  \\"foo\\": \\"FOO\\"
                },
              another == condition2 => {
                  \\"bar\\": \\"BAR\\"
                }
            }"
        `);
      });
    });
  });
});
