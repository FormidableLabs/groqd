import { describe, expect, expectTypeOf, it } from "vitest";
import { GroqBuilderBase, InferResultItem, InferResultType } from "../../index";
import { q } from "../../tests/schemas/nextjs-sanity-fe";
import { ExtractConditionalProjectionTypes } from "./conditional-types";
import { Empty, Simplify } from "../../types/utils";
import { getSubquery } from "../../tests/getSubquery";

const qVariants = q.star.filterByType("variant");

describe("conditional", () => {
  describe("by itself", () => {
    const sub = getSubquery(q).asType<"variant">();
    const conditionalResult = sub.conditional({
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
      expectTypeOf<
        Simplify<ExtractConditionalProjectionTypes<typeof conditionalResult>>
      >().toEqualTypeOf<
        | Empty
        | { onSale: false }
        | { onSale: true; price: number; msrp: number }
      >();
    });
    it("should return a spreadable object", () => {
      expect(conditionalResult).toMatchObject({
        "[CONDITIONAL] [KEY]": expect.any(GroqBuilderBase),
      });
    });
  });

  const qAll = qVariants.project((qV) => ({
    name: true,
    ...qV.conditional({
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
    expectTypeOf<InferResultType<typeof qAll>>().toEqualTypeOf<
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
      "*[_type == "variant"] {
          name,
          price == msrp => {
              "onSale": false
            },
          price < msrp => {
              "onSale": true,
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
        name: true,
        ...qV.conditional({
          "price == msrp": {
            onSale: q.value(false),
          },
          "price < msrp": {
            onSale: q.value(true),
            price: true,
            msrp: true,
          },
        }),
        // Here we're trying to spread another conditional,
        // however, it will override the first one
        // since we didn't specify a unique key:
        ...qV.conditional({
          "second == condition": { price: true },
        }),
      }));

      it("the type will be missing the first conditionals", () => {
        expectTypeOf<InferResultType<typeof qIncorrect>>().toEqualTypeOf<
          Array<{ name: string } | { name: string; price: number }>
        >();
      });
      it("the query will also be missing the first conditionals", () => {
        expect(qIncorrect.query).toMatchInlineSnapshot(`
          "*[_type == "variant"] {
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
          name: true,
          ...qV.conditional({
            "price == msrp": {
              onSale: q.value(false),
            },
            "price < msrp": {
              onSale: q.value(true),
              price: true,
              msrp: true,
            },
          }),
          ...qV.conditional(
            {
              "another == condition1": { foo: q.value("FOO") },
              "another == condition2": { bar: q.value("BAR") },
            },
            { key: "[UNIQUE-KEY]" }
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
        expectTypeOf<Remainder>().toEqualTypeOf<never>();
        expectTypeOf<ActualItem>().toEqualTypeOf<ExpectedItem>();
      });

      it("the query should be compiled correctly", () => {
        expect(qMultipleConditions.query).toMatchInlineSnapshot(`
          "*[_type == "variant"] {
              name,
              price == msrp => {
                  "onSale": false
                },
              price < msrp => {
                  "onSale": true,
                  price,
                  msrp
                },
              another == condition1 => {
                  "foo": "FOO"
                },
              another == condition2 => {
                  "bar": "BAR"
                }
            }"
        `);
      });
    });
  });

  describe("isExhaustive", () => {
    const exhaustiveQuery = qVariants.project((sub) => ({
      name: true,
      ...sub.conditional(
        {
          "price >= msrp": (q) => ({
            onSale: q.value(false),
          }),
          "price < msrp": {
            onSale: q.value(true),
            price: true,
            msrp: true,
          },
        },
        // Use this parameter when you know that
        // at least one condition must be true:
        { isExhaustive: true }
      ),
    }));

    it("should have the correct result type", () => {
      type Result = InferResultType<typeof exhaustiveQuery>;
      type ExpectedResultItem =
        | {
            name: string;
            onSale: false;
          }
        | {
            name: string;
            onSale: true;
            price: number;
            msrp: number;
          };
      expectTypeOf<Result>().toEqualTypeOf<Array<ExpectedResultItem>>();

      // The "isExhaustive" parameter ensures we don't
      // include the "empty" types:
      type NonExhaustiveResult = { name: string } & ExpectedResultItem;
      expectTypeOf<Result>().not.toEqualTypeOf<Array<NonExhaustiveResult>>();
    });
  });

  describe("using query syntax", () => {
    const qAll = qVariants.project((q) => ({
      name: true,
      ...q.conditional({
        "price == msrp": q.project({
          onSale: q.value(false),
        }),
        "price < msrp": (q) =>
          q.project({
            onSale: q.value(true),
            price: true,
            msrp: true,
          }),
      }),
    }));
    it("should have the correct expected type", () => {
      type Result = InferResultType<typeof qAll>;
      type Expected = Array<
        | { name: string }
        | { name: string; onSale: false }
        | { name: string; onSale: true; price: number; msrp: number }
      >;
      expectTypeOf<Result>().toEqualTypeOf<Expected>();
    });
    it("should generate the correct query", () => {
      expect(qAll.query).toMatchInlineSnapshot(`
        "*[_type == "variant"] {
            name,
            price == msrp => {
              "onSale": false
            },
            price < msrp => {
                "onSale": true,
                price,
                msrp
              }
          }"
      `);
    });
    it("should execute correctly", () => {
      // (we actually already test this exact query in a previous test)
    });
  });
});
