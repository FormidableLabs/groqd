import { describe, it, expect } from "vitest";
import { SchemaConfig } from "../tests/schemas/nextjs-sanity-fe";
import { expectType } from "../tests/expectType";
import { ExtractScope } from "../utils/common-types";
import { TypeMismatchError } from "../utils/type-utils";
import { createGroqBuilder } from "../index";
import { mock } from "../tests/mocks/nextjs-sanity-fe-mocks";
import { executeBuilder } from "../tests/mocks/executeQuery";

const q = createGroqBuilder<SchemaConfig>();

const qVariants = q.star.filterByType("variant");

describe("projection (field)", () => {
  const qPrices = qVariants.projection("price");
  const qNames = qVariants.projection("name");
  const data = mock.generateSeedData({
    variants: mock.array(5, (i) =>
      mock.variant({
        name: `Variant ${i}`,
        price: 55 + i,
      })
    ),
  });

  it("can project a number", () => {
    expectType<ExtractScope<typeof qPrices>>().toStrictEqual<Array<number>>();
    expect(qPrices.query).toMatchInlineSnapshot(
      '"*[_type == \\"variant\\"].price"'
    );
  });
  it("can project a string", () => {
    expectType<ExtractScope<typeof qNames>>().toStrictEqual<Array<string>>();
    expect(qNames.query).toMatchInlineSnapshot(
      '"*[_type == \\"variant\\"].name"'
    );
  });

  it("executes correctly (price)", async () => {
    const results = await executeBuilder(data.datalake, qPrices);
    expect(results).toMatchInlineSnapshot(`
      [
        55,
        56,
        57,
        58,
        59,
      ]
    `);
  });
  it("executes correctly (name)", async () => {
    const results = await executeBuilder(data.datalake, qNames);
    expect(results).toMatchInlineSnapshot(`
      [
        "Variant 0",
        "Variant 1",
        "Variant 2",
        "Variant 3",
        "Variant 4",
      ]
    `);
  });
});

describe.only("projection (objects)", () => {
  const data = mock.generateSeedData({
    variants: mock.array(5, (i) =>
      mock.variant({
        id: `variant-${i}`,
        name: `Variant ${i}`,
        price: 100 * i,
        msrp: 200 * i,
      })
    ),
  });

  describe("a single plain property", () => {
    const qName = qVariants.projection({
      name: true,
    });
    it("query should be typed correctly", () => {
      expect(qName.query).toMatchInlineSnapshot(
        '"*[_type == \\"variant\\"]{ name }"'
      );

      expectType<ExtractScope<typeof qName>>().toStrictEqual<
        Array<{
          name: string;
        }>
      >();
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(data.datalake, qName);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "name": "Variant 0",
          },
          {
            "name": "Variant 1",
          },
          {
            "name": "Variant 2",
          },
          {
            "name": "Variant 3",
          },
          {
            "name": "Variant 4",
          },
        ]
      `);
    });
  });

  describe("multiple plain properties", () => {
    const qMultipleFields = qVariants.projection({
      id: true,
      name: true,
      price: true,
      msrp: true,
    });
    it("query should be typed correctly", () => {
      expect(qMultipleFields.query).toMatchInlineSnapshot(
        '"*[_type == \\"variant\\"]{ id, name, price, msrp }"'
      );

      expectType<ExtractScope<typeof qMultipleFields>>().toStrictEqual<
        Array<{
          id: string | undefined;
          name: string;
          price: number;
          msrp: number;
        }>
      >();
    });

    it("should execute correctly", async () => {
      const results = await executeBuilder(data.datalake, qMultipleFields);
      expect(results).toMatchInlineSnapshot(`
        [
          {
            "id": "variant-0",
            "msrp": 0,
            "name": "Variant 0",
            "price": 0,
          },
          {
            "id": "variant-1",
            "msrp": 200,
            "name": "Variant 1",
            "price": 100,
          },
          {
            "id": "variant-2",
            "msrp": 400,
            "name": "Variant 2",
            "price": 200,
          },
          {
            "id": "variant-3",
            "msrp": 600,
            "name": "Variant 3",
            "price": 300,
          },
          {
            "id": "variant-4",
            "msrp": 800,
            "name": "Variant 4",
            "price": 400,
          },
        ]
      `);
    });
  });

  it.skip("cannot projection props that don't exist", () => {
    const res = qVariants.projection({
      INVALID: true,
    });

    expectType<ExtractScope<typeof res>>().toBeAssignableTo<
      Array<{
        INVALID: TypeMismatchError<any>;
      }>
    >();
  });
});
