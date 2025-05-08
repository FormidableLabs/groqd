import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";
import { GroqBuilderBase, InferResultItem, InferResultType } from "../../index";
import { executeBuilder } from "../../tests/mocks/executeQuery";
import { mock } from "../../tests/mocks/nextjs-sanity-fe-mocks";
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

  const qConditional = qVariants.project((qV) => ({
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
    expectTypeOf<InferResultType<typeof qConditional>>().toEqualTypeOf<
      Array<
        | { name: string }
        | { name: string; onSale: false }
        | { name: string; onSale: true; price: number; msrp: number }
      >
    >();
  });
  it("the query should look correct", () => {
    expect(qConditional.query).toMatchInlineSnapshot(
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

  const data = mock.generateSeedData({
    variants: [
      //
      mock.variant({
        name: "Variant 1",
        price: 10,
        msrp: 10,
      }),
      mock.variant({ name: "Variant 2", price: 8, msrp: 9 }),
    ],
  });
  describe("using query syntax", () => {
    const qConditional = qVariants.project((q) => ({
      name: true,
      ...q.conditional({
        "price == msrp": q.project({
          onSale: q.value(false),
          msrp: true,
        }),
        "price < msrp": (q) =>
          q.project({
            onSale: q.value(true),
            price: true,
          }),
      }),
    }));
    it("should have the correct expected type", () => {
      type Result = InferResultType<typeof qConditional>;
      type Expected = Array<
        | { name: string }
        | { name: string; onSale: false; msrp: number }
        | { name: string; onSale: true; price: number }
      >;
      expectTypeOf<Result>().toEqualTypeOf<Expected>();
    });
    it("should generate the correct query", () => {
      expect(qConditional.query).toMatchInlineSnapshot(`
        "*[_type == "variant"] {
            name,
            price == msrp => {
              "onSale": false,
              msrp
            },
            price < msrp => {
                "onSale": true,
                price
              }
          }"
      `);
    });
    it("should execute correctly", async () => {
      const results = await executeBuilder(qConditional, data);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "msrp": 10,
            "name": "Variant 1",
            "onSale": false,
          },
          {
            "name": "Variant 2",
            "onSale": true,
            "price": 8,
          },
        ]
      `);
    });
  });

  describe("with validation", () => {
    const qConditional = qVariants.project((q) => ({
      name: z.string(),
      ...q.conditional({
        "price == msrp": {
          onSale: q.value(false, z.literal(false)),
          msrp: z.number(),
        },
        "price < msrp": {
          onSale: q.value(true, z.literal(true)),
          price: z.number(),
        },
      }),
    }));
    it("should have the correct expected type", () => {
      type Result = InferResultType<typeof qConditional>;
      type Expected = Array<
        | { name: string }
        | { name: string; onSale: false; msrp: number }
        | { name: string; onSale: true; price: number }
      >;
      expectTypeOf<Result>().toEqualTypeOf<Expected>();
    });
    it("should generate the correct query", () => {
      expect(qConditional.query).toMatchInlineSnapshot(`
        "*[_type == "variant"] {
            name,
            price == msrp => {
                "onSale": false,
                msrp
              },
            price < msrp => {
                "onSale": true,
                price
              }
          }"
      `);
    });
    it("should execute correctly", async () => {
      const results = await executeBuilder(qConditional, data);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "msrp": 10,
            "name": "Variant 1",
            "onSale": false,
          },
          {
            "name": "Variant 2",
            "onSale": true,
            "price": 8,
          },
        ]
      `);
    });

    const invalidData = mock.generateSeedData({
      variants: [
        mock.variant({ name: "Variant 1 (valid)", price: 10, msrp: 10 }),
        mock.variant({ name: "Variant 2 (valid)", price: 9, msrp: 10 }),
        mock.variant({ name: "Variant 3 (invalid)", price: 11, msrp: 10 }),
        // @ts-expect-error -- must be numbers
        mock.variant({ name: "Variant 4 (invalid)", price: "10", msrp: "10" }),
        // @ts-expect-error -- must be numbers
        mock.variant({ name: "Variant 5 (invalid)", price: "8", msrp: "9" }),
      ],
    });
    describe("when the data is invalid", () => {
      it("should strip invalid fields", async () => {
        const result = await executeBuilder(qConditional, invalidData);
        expect(result).toMatchInlineSnapshot(`
          [
            {
              "msrp": 10,
              "name": "Variant 1 (valid)",
              "onSale": false,
            },
            {
              "name": "Variant 2 (valid)",
              "onSale": true,
              "price": 9,
            },
            {
              "name": "Variant 3 (invalid)",
            },
            {
              "name": "Variant 4 (invalid)",
            },
            {
              "name": "Variant 5 (invalid)",
            },
          ]
        `);
      });
    });
    describe("when the isExhaustive flag is set", () => {
      const qConditional = qVariants.project((q) => ({
        name: z.string(),
        ...q.conditional(
          {
            "price == msrp": {
              onSale: q.value(false, z.literal(false)),
              msrp: z.number(),
            },
            "price < msrp": {
              onSale: q.value(true, z.literal(true)),
              price: z.number(),
            },
          },
          { isExhaustive: true }
        ),
      }));
      it("should throw an error", async () => {
        await expect(async () => {
          return await executeBuilder(qConditional, invalidData);
        }).rejects.toThrowErrorMatchingInlineSnapshot(`
          [ValidationErrors: 3 Parsing Errors:
          result[2]: The data did not match any of the 2 conditional assertions
          result[3]: The data did not match any of the 2 conditional assertions
          result[4]: The data did not match any of the 2 conditional assertions]
        `);
      });
    });
    describe("when multiple conditions can be true", () => {
      const qConditional = qVariants.project((q) => ({
        name: z.string(),
        ...q.conditional({
          "price < msrp": {
            price: z.number(),
          },
          "price <= msrp": {
            msrp: z.number(),
          },
        }),
      }));
      it("should include fields from both conditions", async () => {
        const results = await executeBuilder(qConditional, data);
        expect(results).toMatchInlineSnapshot(`
          [
            {
              "msrp": 10,
              "name": "Variant 1",
            },
            {
              "msrp": 9,
              "name": "Variant 2",
              "price": 8,
            },
          ]
        `);
      });
    });
  });
});
